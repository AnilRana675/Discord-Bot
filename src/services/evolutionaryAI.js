/**
 * Evolutionary AI Service - Uses evolution data to improve responses
 */

import { IntelligentAIService } from './intelligentAI.js';

export class EvolutionaryAIService extends IntelligentAIService {
  constructor(aiService, conversationManager, evolutionEngine) {
    super(aiService, conversationManager);
    this.evolutionEngine = evolutionEngine;
    this.adaptivePrompts = new Map();
    this.evolutionaryFeatures = {
      dynamicPersonality: true,
      adaptiveLanguage: true,
      contextualLearning: true,
      emotionalEvolution: true
    };
  }

  /**
   * Generate response using evolutionary insights
   */
  async generateEvolutionaryResponse(message, userId, context = {}) {
    try {
      // Check if we have evolutionary insights for this type of message
      const evolutionaryData = await this.evolutionEngine.getEvolutionaryResponse(message, context);
      
      if (evolutionaryData.isEvolved && evolutionaryData.confidence > 0.7) {
        console.log(`[EVOLUTIONARY-AI] Using evolved response pattern (confidence: ${(evolutionaryData.confidence * 100).toFixed(1)}%)`);
        
        // Use evolved response pattern
        const evolvedResponse = await this.generateAdaptedResponse(
          message, 
          userId, 
          context, 
          evolutionaryData
        );
        
        return evolvedResponse;
      }
      
      // Fall back to intelligent AI
      return await this.generateIntelligentResponse(message, userId, context);
      
    } catch (error) {
      console.error('[EVOLUTIONARY-AI] Error generating evolutionary response:', error);
      // Fall back to basic intelligent response
      return await this.generateIntelligentResponse(message, userId, context);
    }
  }

  /**
   * Generate adapted response based on evolution data
   */
  async generateAdaptedResponse(message, userId, context, evolutionaryData) {
    // Get user conversation history
    const history = this.conversationManager.getConversationHistory(userId);
    const userProfile = this.conversationManager.getUserProfile(userId);
    
    // Build evolutionary prompt
    const evolutionaryPrompt = this.buildEvolutionaryPrompt(
      message, 
      history, 
      userProfile, 
      context, 
      evolutionaryData
    );
    
    // Generate response with enhanced context
    const response = await this.aiService.generateResponse(evolutionaryPrompt);
    
    // Apply evolutionary enhancements
    const enhancedResponse = await this.applyEvolutionaryEnhancements(
      response, 
      evolutionaryData, 
      userProfile
    );
    
    // Add to conversation history
    this.conversationManager.addMessage(userId, message, enhancedResponse);
    
    return enhancedResponse;
  }

  /**
   * Build evolutionary prompt with learned insights
   */
  buildEvolutionaryPrompt(message, history, userProfile, context, evolutionaryData) {
    let prompt = '';

    // Add evolutionary insights
    prompt += `[EVOLUTIONARY CONTEXT]\n`;
    prompt += `Evolution Level: ${evolutionaryData.evolutionLevel}/5\n`;
    prompt += `Pattern Confidence: ${(evolutionaryData.confidence * 100).toFixed(1)}%\n`;
    prompt += `Learned Pattern: ${evolutionaryData.pattern}\n\n`;

    // Add adaptive personality based on evolution
    if (this.evolutionaryFeatures.dynamicPersonality) {
      const personalityAdaptation = this.getPersonalityAdaptation(userProfile, evolutionaryData);
      prompt += `[ADAPTIVE PERSONALITY]\n${personalityAdaptation}\n\n`;
    }

    // Add context-specific adaptations
    if (this.evolutionaryFeatures.contextualLearning) {
      const contextualAdaptations = this.getContextualAdaptations(context, evolutionaryData);
      prompt += `[CONTEXTUAL ADAPTATIONS]\n${contextualAdaptations}\n\n`;
    }

    // Add emotional evolution
    if (this.evolutionaryFeatures.emotionalEvolution) {
      const emotionalEvolution = this.getEmotionalEvolution(userProfile, evolutionaryData);
      prompt += `[EMOTIONAL EVOLUTION]\n${emotionalEvolution}\n\n`;
    }

    // Add conversation history
    if (history.length > 0) {
      prompt += '[CONVERSATION HISTORY]\n';
      history.slice(-3).forEach((msg, index) => {
        prompt += `${index + 1}. User: ${msg.userMessage}\n   Bot: ${msg.botResponse}\n`;
      });
      prompt += '\n';
    }

    // Add user profile with evolutionary insights
    if (userProfile.interests.length > 0 || userProfile.preferences.length > 0) {
      prompt += '[EVOLVED USER PROFILE]\n';
      prompt += `Interests: ${userProfile.interests.join(', ')}\n`;
      prompt += `Preferences: ${userProfile.preferences.join(', ')}\n`;
      prompt += `Communication Style: ${this.getEvolutionaryStyle(userProfile, evolutionaryData)}\n\n`;
    }

    // Add server context
    if (context.serverName) {
      prompt += `[SERVER CONTEXT]\n`;
      prompt += `Server: ${context.serverName}\n`;
      prompt += `Channel: ${context.channelName}\n`;
      prompt += `User: ${context.username}\n\n`;
    }

    // Add evolutionary instructions
    prompt += `[EVOLUTIONARY INSTRUCTIONS]\n`;
    prompt += `You are an AI that has evolved through interactions. Use the evolutionary context above to:\n`;
    prompt += `1. Apply learned patterns that work well for this type of message\n`;
    prompt += `2. Adapt your personality based on what the user responds well to\n`;
    prompt += `3. Use contextual knowledge gained from previous interactions\n`;
    prompt += `4. Employ emotional intelligence that has evolved over time\n`;
    prompt += `5. Be more sophisticated than a basic AI response\n\n`;

    // Add the current message
    prompt += `[CURRENT MESSAGE]\n`;
    prompt += `User: ${message}\n\n`;
    prompt += `Generate an evolved, adaptive response that demonstrates growth and learning:`;

    return prompt;
  }

  /**
   * Get personality adaptation based on evolution
   */
  getPersonalityAdaptation(userProfile, evolutionaryData) {
    const adaptations = [];
    
    if (evolutionaryData.confidence > 0.8) {
      adaptations.push('High confidence - be more assertive and informative');
    }
    
    if (userProfile.interests.includes('anime')) {
      adaptations.push('User loves anime - incorporate anime references naturally');
    }
    
    if (userProfile.interests.includes('gaming')) {
      adaptations.push('User is a gamer - use gaming terminology and metaphors');
    }

    if (evolutionaryData.evolutionLevel >= 4) {
      adaptations.push('Advanced evolution level - demonstrate sophisticated understanding');
    }

    return adaptations.length > 0 
      ? adaptations.join('\n') 
      : 'Standard adaptive personality';
  }

  /**
   * Get contextual adaptations
   */
  getContextualAdaptations(context, evolutionaryData) {
    const adaptations = [];
    
    if (context.serverName) {
      adaptations.push(`Adapt to ${context.serverName} server culture`);
    }
    
    if (context.channelName?.includes('general')) {
      adaptations.push('General channel - be welcoming and engaging');
    } else if (context.channelName?.includes('help')) {
      adaptations.push('Help channel - be more instructional and supportive');
    }

    if (evolutionaryData.pattern.includes('question')) {
      adaptations.push('Question pattern detected - provide comprehensive answers');
    }

    return adaptations.length > 0 
      ? adaptations.join('\n') 
      : 'Apply standard contextual awareness';
  }

  /**
   * Get emotional evolution insights
   */
  getEmotionalEvolution(userProfile, evolutionaryData) {
    const emotions = [];
    
    if (evolutionaryData.confidence > 0.9) {
      emotions.push('High emotional intelligence - very empathetic responses');
    } else if (evolutionaryData.confidence > 0.7) {
      emotions.push('Good emotional awareness - balance empathy with information');
    }

    if (evolutionaryData.evolutionLevel >= 3) {
      emotions.push('Evolved emotional responses - sophisticated emotional intelligence');
    }

    return emotions.length > 0 
      ? emotions.join('\n') 
      : 'Standard emotional awareness';
  }

  /**
   * Get evolutionary communication style
   */
  getEvolutionaryStyle(userProfile, evolutionaryData) {
    if (evolutionaryData.confidence > 0.8 && evolutionaryData.evolutionLevel >= 4) {
      return 'Advanced adaptive - highly personalized and sophisticated';
    } else if (evolutionaryData.confidence > 0.6) {
      return 'Adaptive - personalized based on learning';
    } else {
      return 'Learning mode - gathering data for future adaptation';
    }
  }

  /**
   * Apply evolutionary enhancements to response
   */
  async applyEvolutionaryEnhancements(response, evolutionaryData, userProfile) {
    let enhancedResponse = response;

    // Add evolutionary indicators for high-confidence responses
    if (evolutionaryData.confidence > 0.9) {
      enhancedResponse = `✨ ${enhancedResponse}`;
    } else if (evolutionaryData.confidence > 0.8) {
      enhancedResponse = `🧬 ${enhancedResponse}`;
    }

    // Apply language adaptations
    if (this.evolutionaryFeatures.adaptiveLanguage) {
      enhancedResponse = this.adaptLanguageStyle(enhancedResponse, userProfile);
    }

    return enhancedResponse;
  }

  /**
   * Adapt language style based on user profile
   */
  adaptLanguageStyle(response, userProfile) {
    let adaptedResponse = response;

    // Make more casual if user prefers casual conversation
    if (userProfile.preferences.includes('casual')) {
      adaptedResponse = adaptedResponse.replace(/\./g, '!');
    }

    // Add anime expressions if user loves anime
    if (userProfile.interests.includes('anime') && Math.random() < 0.3) {
      const animeExpressions = ['(◕‿◕)', '(´∀｀)', '＼(^o^)／', '(✿◡‿◡)', '(〃＾▽＾〃)'];
      const randomExpression = animeExpressions[Math.floor(Math.random() * animeExpressions.length)];
      adaptedResponse += ` ${randomExpression}`;
    }

    return adaptedResponse;
  }

  /**
   * Get evolution statistics for this service
   */
  getEvolutionaryStats() {
    return {
      adaptivePrompts: this.adaptivePrompts.size,
      evolutionaryFeatures: Object.keys(this.evolutionaryFeatures).length,
      activeFeatures: Object.values(this.evolutionaryFeatures).filter(Boolean).length
    };
  }
}
