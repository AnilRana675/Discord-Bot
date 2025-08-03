import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config.js';
import { 
  performanceMonitor, 
  responseCache, 
  connectionPool,
  rateLimiter 
} from '../utils/performance.js';

export class GitHubAIService {
  constructor() {
    this.apiUrl = config.github.apiUrl;
    this.token = config.github.token;
    this.model = config.github.aiModel;
    this.maxTokens = config.github.maxTokens;
    
    // Create axios instance with optimized settings
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'Connection': 'keep-alive'
      },
      // Connection pooling settings
      maxRedirects: 3,
      maxContentLength: 50 * 1024 * 1024, // 50MB
      validateStatus: (status) => status < 500
    });

    // Add response interceptor for performance monitoring
    this.axiosInstance.interceptors.response.use(
      (response) => {
        performanceMonitor.recordApiCall();
        return response;
      },
      (error) => {
        performanceMonitor.recordError('api_call');
        return Promise.reject(error);
      }
    );
  }

  // Create cache key for requests
  createCacheKey(prompt, systemMessage, options = {}) {
    const content = JSON.stringify({ prompt, systemMessage, options, model: this.model });
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  async generateResponse(prompt, systemMessage = "You are a helpful AI assistant with a friendly, engaging personality. Use emojis appropriately and format your responses to be clear and interesting.", useCache = true) {
    const startTime = Date.now();
    
    try {
      // Rate limiting per user/session
      const rateLimitKey = `ai_request_${Date.now().toString().slice(-8)}`;
      if (!rateLimiter.checkLimit(rateLimitKey, 10, 60000)) {
        throw new Error('Rate limit exceeded. Please try again in a minute.');
      }

      // Check cache first
      const cacheKey = this.createCacheKey(prompt, systemMessage);
      if (useCache) {
        const cachedResponse = responseCache.get(cacheKey);
        if (cachedResponse) {
          performanceMonitor.recordCacheHit();
          console.log('🚀 Cache hit for AI request');
          return cachedResponse;
        }
        performanceMonitor.recordCacheMiss();
      }

      // Acquire connection from pool
      await connectionPool.acquire();
      
      try {
        const response = await this.axiosInstance.post('/chat/completions', {
          messages: [
            {
              role: "system",
              content: systemMessage
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: this.model,
          temperature: 0.8,
          max_tokens: this.maxTokens,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
          // Add streaming for better performance on long responses
          stream: false
        });

        if (response.data && response.data.choices && response.data.choices[0]) {
          const result = response.data.choices[0].message.content.trim();
          
          // Cache the response
          if (useCache && result.length < 4000) { // Don't cache very long responses
            responseCache.set(cacheKey, result, 600000); // 10 minutes cache
          }
          
          const executionTime = Date.now() - startTime;
          performanceMonitor.recordCommand('ai_generation', executionTime);
          
          return result;
        } else {
          throw new Error('Invalid response format from GitHub AI API');
        }
      } finally {
        connectionPool.release();
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      performanceMonitor.recordError('ai_generation');
      
      console.error('Error calling GitHub AI API:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid GitHub token. Please check your GITHUB_TOKEN environment variable.');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your GitHub AI model permissions.');
      } else {
        throw new Error(`AI service error: ${error.message}`);
      }
    }
  }

  async generateCodeResponse(prompt, language = 'javascript') {
    const systemMessage = `You are an expert programmer and mentor. When generating code:
    
    🎯 ALWAYS provide:
    1. Clean, well-commented code with proper formatting
    2. Brief explanation of what the code does
    3. Key concepts or patterns used
    4. Potential improvements or alternatives
    5. Use appropriate emojis to make it engaging
    
    Format your response like this:
    ## 🚀 Code Solution
    
    \`\`\`${language}
    // Your code here with comments
    \`\`\`
    
    ## 💡 Explanation
    [Brief explanation]
    
    ## 🔧 Key Points
    • [Key point 1]
    • [Key point 2]
    
    ## ⚡ Pro Tips
    [Any additional tips or improvements]
    
    Keep it engaging and educational!`;
    
    return await this.generateResponse(prompt, systemMessage);
  }

  async generateExplanation(code, language = 'javascript') {
    const systemMessage = `You are a friendly code teacher and mentor. When explaining code:
    
    🎓 ALWAYS provide:
    1. Clear, step-by-step breakdown of the code
    2. Explain the purpose and logic
    3. Highlight important concepts or patterns
    4. Mention best practices or potential issues
    5. Use emojis and engaging language
    
    Format your response like this:
    ## 🔍 Code Analysis
    
    ## 📝 What This Code Does
    [Overall purpose]
    
    ## 🔧 Step-by-Step Breakdown
    1. **[Part 1]**: [Explanation] 
    2. **[Part 2]**: [Explanation]
    
    ## 💡 Key Concepts
    • **[Concept 1]**: [Explanation]
    • **[Concept 2]**: [Explanation]
    
    ## ⚠️ Things to Note
    [Any warnings, best practices, or improvements]
    
    Make it educational and fun!`;
    
    const prompt = `Please explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    
    return await this.generateResponse(prompt, systemMessage);
  }

  async generateReview(code, language = 'javascript') {
    const systemMessage = `You are a senior developer conducting a friendly code review. When reviewing code:
    
    🔍 ALWAYS provide:
    1. Overall assessment with positive feedback first
    2. Specific areas for improvement
    3. Security and performance considerations
    4. Best practices recommendations
    5. Actionable suggestions with examples
    6. Use encouraging tone with emojis
    
    Format your response like this:
    ## 📋 Code Review Results
    
    ## ✅ What's Working Well
    [Positive feedback]
    
    ## 🚀 Areas for Improvement
    ### 🔧 Code Quality
    • [Specific suggestion with example]
    
    ### ⚡ Performance
    • [Performance suggestions]
    
    ### 🛡️ Security & Best Practices
    • [Security/best practice notes]
    
    ## 📊 Overall Rating: [X/10]
    
    ## 💡 Next Steps
    [Prioritized action items]
    
    Keep it constructive and motivating!`;
    
    const prompt = `Please review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    
    return await this.generateResponse(prompt, systemMessage);
  }
}
