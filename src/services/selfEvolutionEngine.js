/**
 * Self-Evolution Engine - Enables bot to learn and adapt over time
 */

import fs from 'fs/promises';
import path from 'path';

export class SelfEvolutionEngine {
  constructor() {
    this.learningData = new Map();
    this.responsePatterns = new Map();
    this.evolutionHistory = [];
    this.adaptationThresholds = {
      minInteractions: 10,
      confidenceThreshold: 0.7,
      evolutionInterval: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    this.lastEvolution = Date.now();
    this.initializeEvolution();
  }

  async initializeEvolution() {
    await this.loadEvolutionData();
    this.startEvolutionCycle();
  }

  /**
   * Learn from user interactions
   */
  async learnFromInteraction(userId, userMessage, botResponse, userReaction = null) {
    const interactionKey = this.generateInteractionKey(userMessage);
    
    if (!this.learningData.has(interactionKey)) {
      this.learningData.set(interactionKey, {
        patterns: [],
        successfulResponses: [],
        failedResponses: [],
        userSatisfaction: 0,
        totalInteractions: 0,
        lastUpdated: Date.now()
      });
    }

    const data = this.learningData.get(interactionKey);
    data.totalInteractions++;
    data.lastUpdated = Date.now();

    // Analyze user reaction (positive/negative feedback)
    if (userReaction) {
      const satisfaction = this.analyzeUserSatisfaction(userReaction);
      data.userSatisfaction = (data.userSatisfaction + satisfaction) / 2;
      
      if (satisfaction > 0.7) {
        data.successfulResponses.push({
          response: botResponse,
          timestamp: Date.now(),
          satisfaction
        });
      } else if (satisfaction < 0.3) {
        data.failedResponses.push({
          response: botResponse,
          timestamp: Date.now(),
          satisfaction
        });
      }
    }

    // Learn pattern recognition
    this.learnMessagePatterns(userMessage, botResponse, userReaction);
    
    await this.saveEvolutionData();
  }

  /**
   * Generate new response patterns based on learning
   */
  evolveResponsePatterns() {
    console.log('[EVOLUTION] Analyzing interaction patterns for evolution...');
    
    const improvements = [];
    
    for (const [pattern, data] of this.learningData.entries()) {
      if (data.totalInteractions >= this.adaptationThresholds.minInteractions) {
        const evolution = this.analyzePatternEvolution(pattern, data);
        if (evolution) {
          improvements.push(evolution);
        }
      }
    }

    return improvements;
  }

  /**
   * Analyze and evolve conversation patterns
   */
  analyzePatternEvolution(pattern, data) {
    const successRate = data.successfulResponses.length / data.totalInteractions;
    const avgSatisfaction = data.userSatisfaction;

    if (successRate < 0.5 || avgSatisfaction < 0.6) {
      // Pattern needs improvement
      return {
        type: 'IMPROVE_PATTERN',
        pattern,
        currentSuccess: successRate,
        currentSatisfaction: avgSatisfaction,
        suggestedImprovements: this.generateImprovements(data),
        priority: this.calculatePriority(successRate, avgSatisfaction)
      };
    }

    if (successRate > 0.8 && avgSatisfaction > 0.8) {
      // Pattern is successful, can be reinforced
      return {
        type: 'REINFORCE_PATTERN',
        pattern,
        successRate,
        satisfaction: avgSatisfaction,
        reinforcements: this.generateReinforcements(data)
      };
    }

    return null;
  }

  /**
   * Self-modify conversation prompts
   */
  async evolvePersistentPrompts() {
    const evolutionInsights = this.evolveResponsePatterns();
    
    if (evolutionInsights.length === 0) return false;

    const newPromptImprovements = [];

    for (const insight of evolutionInsights) {
      if (insight.type === 'IMPROVE_PATTERN') {
        const promptImprovement = await this.generatePromptImprovement(insight);
        newPromptImprovements.push(promptImprovement);
      }
    }

    if (newPromptImprovements.length > 0) {
      await this.updateSystemPrompts(newPromptImprovements);
      this.logEvolution('PROMPT_EVOLUTION', newPromptImprovements);
      return true;
    }

    return false;
  }

  /**
   * Adaptive response generation based on learned patterns
   */
  async getEvolutionaryResponse(userMessage, context = {}) {
    const pattern = this.generateInteractionKey(userMessage);
    const learnedData = this.learningData.get(pattern);

    if (learnedData && learnedData.successfulResponses.length > 0) {
      // Use evolved patterns
      const bestResponse = learnedData.successfulResponses
        .sort((a, b) => b.satisfaction - a.satisfaction)[0];
      
      return {
        isEvolved: true,
        confidence: learnedData.userSatisfaction,
        pattern: pattern,
        evolutionLevel: this.calculateEvolutionLevel(learnedData),
        suggestedResponse: this.adaptResponse(bestResponse.response, context)
      };
    }

    return {
      isEvolved: false,
      confidence: 0,
      pattern: pattern
    };
  }

  /**
   * Auto-improve AI prompts based on learning
   */
  async generatePromptImprovement(insight) {
    const improvement = {
      area: insight.pattern,
      currentIssue: `Low success rate: ${(insight.currentSuccess * 100).toFixed(1)}%`,
      suggestedFix: '',
      implementation: '',
      expectedImprovement: ''
    };

    // Analyze failed responses to understand issues
    const commonFailures = this.analyzeFailurePatterns(insight);
    
    if (commonFailures.includes('too_generic')) {
      improvement.suggestedFix = 'Add more specific, contextual responses';
      improvement.implementation = 'Include user interests and conversation history in responses';
    } else if (commonFailures.includes('wrong_emotion')) {
      improvement.suggestedFix = 'Improve emotion detection accuracy';
      improvement.implementation = 'Enhance emotion keywords and context analysis';
    } else if (commonFailures.includes('repetitive')) {
      improvement.suggestedFix = 'Increase response variety';
      improvement.implementation = 'Add response templates and dynamic content generation';
    }

    improvement.expectedImprovement = `Target: ${(insight.currentSuccess + 0.3).toFixed(1)}% success rate`;
    
    return improvement;
  }

  /**
   * Machine learning-like pattern recognition
   */
  learnMessagePatterns(userMessage, botResponse, userReaction) {
    const features = this.extractMessageFeatures(userMessage);
    const responseQuality = this.evaluateResponseQuality(botResponse, userReaction);

    const patternKey = this.createPatternKey(features);
    
    if (!this.responsePatterns.has(patternKey)) {
      this.responsePatterns.set(patternKey, {
        features,
        responses: [],
        averageQuality: 0,
        learningCount: 0
      });
    }

    const pattern = this.responsePatterns.get(patternKey);
    pattern.responses.push({
      response: botResponse,
      quality: responseQuality,
      timestamp: Date.now()
    });

    // Update average quality (simple moving average)
    pattern.averageQuality = pattern.responses.reduce((sum, r) => sum + r.quality, 0) / pattern.responses.length;
    pattern.learningCount++;

    // Keep only best responses
    if (pattern.responses.length > 10) {
      pattern.responses = pattern.responses
        .sort((a, b) => b.quality - a.quality)
        .slice(0, 10);
    }
  }

  /**
   * Self-modification capabilities
   */
  async evolveCapabilities() {
    const capabilities = await this.analyzeRequiredCapabilities();
    const newFeatures = [];

    for (const capability of capabilities) {
      if (capability.demand > 0.7 && !capability.exists) {
        const feature = await this.generateNewFeature(capability);
        newFeatures.push(feature);
      }
    }

    if (newFeatures.length > 0) {
      await this.implementNewFeatures(newFeatures);
      this.logEvolution('CAPABILITY_EVOLUTION', newFeatures);
    }
  }

  /**
   * Helper methods
   */
  generateInteractionKey(message) {
    // Create a key based on message intent and structure
    const words = message.toLowerCase().split(' ');
    const keyWords = words.filter(word => word.length > 3);
    return keyWords.slice(0, 3).join('_') || 'general';
  }

  analyzeUserSatisfaction(reaction) {
    const positiveReactions = ['👍', '❤️', '😊', '🎉', '✅', 'thanks', 'great', 'awesome', 'perfect'];
    const negativeReactions = ['👎', '😞', '❌', '😠', 'bad', 'wrong', 'terrible', 'awful'];
    
    const lowerReaction = reaction.toLowerCase();
    
    if (positiveReactions.some(pos => lowerReaction.includes(pos))) {
      return 0.9;
    } else if (negativeReactions.some(neg => lowerReaction.includes(neg))) {
      return 0.1;
    }
    
    return 0.5; // Neutral
  }

  extractMessageFeatures(message) {
    return {
      length: message.length,
      hasQuestion: message.includes('?'),
      hasExclamation: message.includes('!'),
      sentiment: this.analyzeSentiment(message),
      complexity: this.analyzeComplexity(message),
      topics: this.extractTopics(message)
    };
  }

  /**
   * Start autonomous evolution cycle
   */
  startEvolutionCycle() {
    setInterval(async () => {
      if (Date.now() - this.lastEvolution > this.adaptationThresholds.evolutionInterval) {
        console.log('[EVOLUTION] Starting self-evolution cycle...');
        
        const promptEvolved = await this.evolvePersistentPrompts();
        await this.evolveCapabilities();
        
        if (promptEvolved) {
          console.log('[EVOLUTION] ✅ Successfully evolved response patterns!');
        }
        
        this.lastEvolution = Date.now();
        await this.saveEvolutionData();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Evolution data persistence
   */
  async saveEvolutionData() {
    try {
      const data = {
        learningData: Array.from(this.learningData.entries()),
        responsePatterns: Array.from(this.responsePatterns.entries()),
        evolutionHistory: this.evolutionHistory,
        lastEvolution: this.lastEvolution
      };
      
      await fs.writeFile(
        path.join(process.cwd(), 'evolution-data.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error('[EVOLUTION] Failed to save evolution data:', error);
    }
  }

  async loadEvolutionData() {
    try {
      const data = JSON.parse(
        await fs.readFile(path.join(process.cwd(), 'evolution-data.json'), 'utf-8')
      );
      
      this.learningData = new Map(data.learningData || []);
      this.responsePatterns = new Map(data.responsePatterns || []);
      this.evolutionHistory = data.evolutionHistory || [];
      this.lastEvolution = data.lastEvolution || Date.now();
    } catch (error) {
      console.log('[EVOLUTION] No existing evolution data found, starting fresh');
    }
  }

  logEvolution(type, data) {
    this.evolutionHistory.push({
      type,
      data,
      timestamp: Date.now(),
      id: `evolution_${Date.now()}`
    });
    
    console.log(`[EVOLUTION] ${type}:`, data);
  }

  // Additional helper methods...
  analyzeSentiment(message) { 
    const positiveWords = ['good', 'great', 'awesome', 'love', 'amazing', 'perfect', 'excellent'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'stupid'];
    
    const words = message.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
  
  analyzeComplexity(message) {
    const words = message.split(' ').length;
    const sentences = message.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (words > 50 || avgWordsPerSentence > 15) return 'high';
    if (words > 20 || avgWordsPerSentence > 8) return 'medium';
    return 'low';
  }
  
  extractTopics(message) {
    const topicKeywords = {
      'anime': ['anime', 'manga', 'otaku', 'japan', 'japanese'],
      'gaming': ['game', 'gaming', 'play', 'player', 'console'],
      'tech': ['code', 'programming', 'computer', 'tech', 'software'],
      'help': ['help', 'how', 'what', 'why', 'explain', 'tutorial']
    };
    
    const words = message.toLowerCase().split(' ');
    const topics = [];
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => words.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics.length > 0 ? topics : ['general'];
  }
  
  generateImprovements(data) {
    const improvements = [];
    
    if (data.failedResponses.length > data.successfulResponses.length) {
      improvements.push('Add more contextual responses');
      improvements.push('Improve emotion detection');
    }
    
    if (data.userSatisfaction < 0.5) {
      improvements.push('Make responses more engaging');
      improvements.push('Add personality to responses');
    }
    
    return improvements;
  }
  
  generateReinforcements(data) {
    const reinforcements = [];
    
    if (data.successfulResponses.length > 5) {
      reinforcements.push('Increase usage of successful patterns');
      reinforcements.push('Apply successful elements to similar contexts');
    }
    
    return reinforcements;
  }
  
  calculatePriority(successRate, satisfaction) {
    const combinedScore = (successRate + satisfaction) / 2;
    if (combinedScore < 0.3) return 'high';
    if (combinedScore < 0.6) return 'medium';
    return 'low';
  }
  
  calculateEvolutionLevel(data) {
    const totalInteractions = data.totalInteractions;
    const satisfactionLevel = data.userSatisfaction;
    
    if (totalInteractions > 100 && satisfactionLevel > 0.8) return 5;
    if (totalInteractions > 50 && satisfactionLevel > 0.7) return 4;
    if (totalInteractions > 25 && satisfactionLevel > 0.6) return 3;
    if (totalInteractions > 10 && satisfactionLevel > 0.5) return 2;
    return 1;
  }
  
  adaptResponse(response, context) {
    let adaptedResponse = response;
    
    if (context.username) {
      adaptedResponse = adaptedResponse.replace(/\buser\b/gi, context.username);
    }
    
    if (context.serverName) {
      adaptedResponse = adaptedResponse.replace(/\bserver\b/gi, context.serverName);
    }
    
    return adaptedResponse;
  }
  
  analyzeFailurePatterns(insight) {
    const failures = [];
    
    if (insight.currentSatisfaction < 0.3) {
      failures.push('too_generic');
    }
    
    if (insight.currentSuccess < 0.4) {
      failures.push('wrong_emotion');
    }
    
    if (insight.pattern.includes('repeat')) {
      failures.push('repetitive');
    }
    
    return failures;
  }
  
  createPatternKey(features) {
    return `${features.sentiment}_${features.complexity}_${features.topics.join(',')}_${features.length > 100 ? 'long' : 'short'}`;
  }
  
  evaluateResponseQuality(response, reaction) {
    if (!reaction) return 0.5;
    
    const satisfaction = this.analyzeUserSatisfaction(reaction);
    const responseLength = response.length;
    const hasEmoji = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/u.test(response);
    
    let quality = satisfaction;
    
    // Adjust based on response characteristics
    if (responseLength > 50 && responseLength < 300) quality += 0.1;
    if (hasEmoji) quality += 0.05;
    
    return Math.min(Math.max(quality, 0), 1);
  }
  
  async analyzeRequiredCapabilities() {
    const capabilities = [
      { name: 'Enhanced Emotion Detection', demand: 0.8, exists: false },
      { name: 'Context Memory', demand: 0.7, exists: true },
      { name: 'Personality Adaptation', demand: 0.6, exists: false },
      { name: 'Multi-language Support', demand: 0.5, exists: false }
    ];
    
    return capabilities;
  }
  
  async generateNewFeature(capability) {
    return {
      name: capability.name,
      description: `Auto-generated feature based on user demand`,
      priority: capability.demand,
      implementation: 'Self-generated implementation',
      timestamp: Date.now()
    };
  }
  
  async implementNewFeatures(features) {
    console.log('[EVOLUTION] Implementing new features:', features);
    // In a real implementation, this would modify the bot's code
    return true;
  }
  
  async updateSystemPrompts(improvements) {
    console.log('[EVOLUTION] Updating system prompts:', improvements);
    // In a real implementation, this would update AI prompts
    return true;
  }

  /**
   * Public methods for the evolution command
   */
  getEvolutionStats() {
    const totalInteractions = Array.from(this.learningData.values())
      .reduce((sum, data) => sum + data.totalInteractions, 0);
    
    const learnedPatterns = this.learningData.size;
    
    const avgSatisfaction = Array.from(this.learningData.values())
      .reduce((sum, data) => sum + data.userSatisfaction, 0) / Math.max(learnedPatterns, 1);
    
    const successfulInteractions = Array.from(this.learningData.values())
      .reduce((sum, data) => sum + data.successfulResponses.length, 0);
    
    const successRate = totalInteractions > 0 ? successfulInteractions / totalInteractions : 0;
    
    return {
      totalInteractions,
      learnedPatterns,
      successRate,
      avgSatisfaction,
      evolutionLevel: this.calculateOverallEvolutionLevel(),
      lastEvolution: this.lastEvolution,
      activeImprovements: this.evolutionHistory.filter(e => 
        Date.now() - e.timestamp < 24 * 60 * 60 * 1000
      ).length,
      pendingCapabilities: 0,
      messagesToday: this.getTodayInteractions(),
      positiveFeedback: this.getPositiveFeedbackCount(),
      negativeFeedback: this.getNegativeFeedbackCount(),
      learningEfficiency: this.calculateLearningEfficiency()
    };
  }

  getCurrentCapabilities() {
    const capabilities = [];
    
    for (const [pattern, data] of this.responsePatterns.entries()) {
      if (data.averageQuality > 0.6 && data.learningCount > 5) {
        capabilities.push({
          name: `Pattern: ${pattern}`,
          type: 'Learned Response Pattern',
          confidence: data.averageQuality,
          usageCount: data.learningCount,
          successRate: data.averageQuality
        });
      }
    }
    
    return capabilities.sort((a, b) => b.confidence - a.confidence);
  }

  getEvolutionHistory() {
    return this.evolutionHistory;
  }

  // Helper methods for stats
  calculateOverallEvolutionLevel() {
    const avgLevel = Array.from(this.learningData.values())
      .map(data => this.calculateEvolutionLevel(data))
      .reduce((sum, level) => sum + level, 0) / Math.max(this.learningData.size, 1);
    
    return Math.round(avgLevel);
  }

  getTodayInteractions() {
    const today = new Date().toDateString();
    return Array.from(this.learningData.values())
      .filter(data => new Date(data.lastUpdated).toDateString() === today)
      .reduce((sum, data) => sum + data.totalInteractions, 0);
  }

  getPositiveFeedbackCount() {
    return Array.from(this.learningData.values())
      .reduce((sum, data) => sum + data.successfulResponses.length, 0);
  }

  getNegativeFeedbackCount() {
    return Array.from(this.learningData.values())
      .reduce((sum, data) => sum + data.failedResponses.length, 0);
  }

  calculateLearningEfficiency() {
    const totalFeedback = this.getPositiveFeedbackCount() + this.getNegativeFeedbackCount();
    const positiveFeedback = this.getPositiveFeedbackCount();
    
    return totalFeedback > 0 ? positiveFeedback / totalFeedback : 0;
  }
}
