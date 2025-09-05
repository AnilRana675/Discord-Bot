/**
 * Enhanced AI Service with Advanced Intelligence Features
 */

export class IntelligentAIService {
  constructor(aiService, conversationManager) {
    this.aiService = aiService;
    this.conversationManager = conversationManager;
    
    this.emotionKeywords = {
      happy: ['happy', 'joy', 'excited', 'great', 'awesome', 'wonderful', 'amazing', 'love', 'best'],
      sad: ['sad', 'depressed', 'down', 'upset', 'crying', 'hurt', 'broken', 'disappointed'],
      angry: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'hate', 'pissed'],
      confused: ['confused', 'lost', 'help', 'understand', 'what', 'how', 'why', 'dunno'],
      excited: ['excited', 'hyped', 'pumped', 'can\'t wait', 'omg', 'wow', 'epic']
    };

    this.responseStyles = {
      casual: ['Hey!', 'Yo!', 'What\'s up!', 'Sup!'],
      formal: ['Hello there!', 'Good day!', 'Greetings!'],
      enthusiastic: ['OMG!', 'YESSS!', 'AWESOME!', 'AMAZING!'],
      supportive: ['I\'m here for you', 'You\'ve got this', 'I understand', 'That makes sense']
    };
  }

  /**
   * Detect emotion from user message
   */
  detectEmotion(message) {
    const lowerMessage = message.toLowerCase();
    const emotions = {};

    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      emotions[emotion] = keywords.filter(keyword => 
        lowerMessage.includes(keyword)
      ).length;
    }

    // Find the dominant emotion
    const dominantEmotion = Object.keys(emotions).reduce((a, b) => 
      emotions[a] > emotions[b] ? a : b
    );

    return {
      dominant: emotions[dominantEmotion] > 0 ? dominantEmotion : 'neutral',
      scores: emotions,
      confidence: Math.max(...Object.values(emotions)) / message.split(' ').length
    };
  }

  /**
   * Generate intelligent response with context and emotion awareness
   */
  async generateIntelligentResponse(message, userId, discordContext = {}) {
    try {
      console.log('[INTELLIGENT AI] Processing message:', message);
      
      // Store user message in conversation history
      this.conversationManager.addMessage(userId, message, 'user');
      
      // Get conversation context
      const conversationHistory = this.conversationManager.getConversationHistory(userId);
      const userProfile = this.conversationManager.getUserProfile(userId);
      
      // Detect emotion
      const emotion = this.detectEmotion(message);
      console.log('[INTELLIGENT AI] Detected emotion:', emotion);
      
      // Update user interests based on message
      this.conversationManager.updateUserInterests(userId, message);
      
      // Build enhanced prompt with all context
      const enhancedPrompt = this.buildIntelligentPrompt(
        message, 
        conversationHistory, 
        userProfile, 
        emotion, 
        discordContext
      );
      
      console.log('[INTELLIGENT AI] Enhanced prompt created');
      
      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(enhancedPrompt);
      
      // Enhance response with personalization
      const enhancedResponse = this.enhanceResponse(aiResponse, {
        emotion: emotion.dominant,
        userProfile,
        conversationHistory
      });
      
      // Store bot response in conversation history
      this.conversationManager.addMessage(userId, enhancedResponse, 'bot');
      
      console.log('[INTELLIGENT AI] Generated intelligent response');
      return enhancedResponse;
      
    } catch (error) {
      console.error('[INTELLIGENT AI] Error generating response:', error);
      
      // Re-throw the error so the main handler can manage fallbacks
      throw error;
    }
  }

  /**
   * Build intelligent prompt with all available context
   */
  buildIntelligentPrompt(message, conversationHistory, userProfile, emotion, discordContext) {
    let prompt = `You are Shelly, an intelligent and emotionally aware AI assistant with advanced conversational abilities.

CONTEXT INFORMATION:
- Server: ${discordContext.serverName} (${discordContext.serverId})
- Channel: ${discordContext.channelName} (${discordContext.channelId})
- User: ${discordContext.username} (${discordContext.userId})

CONVERSATION MEMORY (Last ${conversationHistory.length} messages):
`;

    // Add conversation history
    conversationHistory.slice(-5).forEach((msg, index) => {
      prompt += `${index + 1}. [${msg.role.toUpperCase()}] ${msg.content}\n`;
    });

    prompt += `\nUSER PROFILE:`;
    if (userProfile.name) prompt += `\n- Name: ${userProfile.name}`;
    if (userProfile.interests.length > 0) prompt += `\n- Interests: ${userProfile.interests.join(', ')}`;
    if (userProfile.mood) prompt += `\n- Current Mood: ${userProfile.mood}`;
    
    prompt += `\nEMOTION ANALYSIS:
- Detected Emotion: ${emotion.dominant}
- Confidence: ${(emotion.confidence * 100).toFixed(1)}%
- Emotion Scores: ${Object.entries(emotion.scores).map(([e, s]) => `${e}:${s}`).join(', ')}

CURRENT MESSAGE: "${message}"

INSTRUCTIONS:
1. Use the conversation history to maintain context and continuity
2. Respond appropriately to the detected emotion (${emotion.dominant})
3. Reference user interests when relevant: ${userProfile.interests.join(', ') || 'none detected yet'}
4. Be natural, conversational, and human-like
5. Keep responses concise but meaningful (1-3 sentences usually)
6. Use emojis sparingly but effectively
7. Remember previous topics we've discussed
8. If this is a greeting or first interaction, be welcoming but not overwhelming

Generate a response that feels intelligent, contextual, and emotionally appropriate:`;

    return prompt;
  }

  /**
   * Enhance response with personalization
   */
  enhanceResponse(response, context) {
    let enhanced = response;
    
    // Add emotion-appropriate elements
    switch (context.emotion) {
      case 'happy':
        if (!enhanced.includes('😊') && !enhanced.includes('🎉') && Math.random() > 0.7) {
          enhanced += ' 😊';
        }
        break;
      case 'sad':
        if (!enhanced.includes('💙') && !enhanced.includes('🫂') && Math.random() > 0.8) {
          enhanced += ' 💙';
        }
        break;
      case 'excited':
        if (!enhanced.includes('🎉') && !enhanced.includes('✨') && Math.random() > 0.6) {
          enhanced += ' ✨';
        }
        break;
    }
    
    return enhanced;
  }

  /**
   * Get fallback response based on emotion
   */
  getFallbackResponse(userEmotion) {
    const fallbacks = {
      happy: [
        "That's awesome! I love your positive energy! 😊",
        "Your happiness is contagious! What's got you so cheerful?",
        "I'm so glad you're feeling great! 🎉"
      ],
      sad: [
        "I'm here if you need to talk. Sometimes sharing helps 💙",
        "I can sense you might be going through something tough. Want to share?",
        "Sending you virtual hugs. What's on your mind? 🫂"
      ],
      angry: [
        "I can tell you're frustrated. Want to talk about what's bothering you?",
        "Sometimes it helps to get things off your chest. I'm listening.",
        "That sounds really frustrating. How can I help?"
      ],
      confused: [
        "No worries! I'm here to help clarify things. What's puzzling you?",
        "Let's figure this out together! What specifically is confusing?",
        "I'm happy to help explain things! What would you like to understand better?"
      ],
      excited: [
        "Your excitement is amazing! Tell me more! ✨",
        "I love your energy! What's got you so pumped up?",
        "This is so exciting! I want to hear all about it! 🎉"
      ],
      neutral: [
        "I'm here and ready to chat! What's on your mind?",
        "Hey there! How's your day going?",
        "What would you like to talk about today?"
      ]
    };

    const responses = fallbacks[userEmotion] || fallbacks.neutral;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate conversation suggestions
   */
  generateSuggestions(userMessage, userInterests = []) {
    const suggestions = [];
    
    // Interest-based suggestions
    if (userInterests.includes('gaming')) {
      suggestions.push("What games have you been playing lately?");
    }
    if (userInterests.includes('anime')) {
      suggestions.push("Any new anime recommendations?");
    }
    if (userInterests.includes('coding')) {
      suggestions.push("Working on any cool projects?");
    }
    
    // Generic conversation starters
    suggestions.push(
      "How has your day been?",
      "What's something interesting that happened recently?",
      "Any exciting plans coming up?"
    );
    
    return suggestions.slice(0, 3);
  }

  /**
   * Analyze message complexity for response adjustment
   */
  analyzeMessageComplexity(message) {
    const words = message.split(' ').length;
    const sentences = message.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    return {
      wordCount: words,
      sentenceCount: sentences,
      avgWordsPerSentence,
      complexity: avgWordsPerSentence > 15 ? 'high' : avgWordsPerSentence > 8 ? 'medium' : 'low'
    };
  }
}
