/**
 * Conversation Manager - Adds memory and context to bot conversations
 */

export class ConversationManager {
  constructor(maxHistoryLength = 10) {
    this.conversations = new Map(); // userId -> conversation history
    this.maxHistoryLength = maxHistoryLength;
    this.userProfiles = new Map(); // userId -> user profile data
  }

  /**
   * Add a message to conversation history
   */
  addMessage(userId, message, role = 'user') {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }

    const conversation = this.conversations.get(userId);
    const timestamp = new Date().toISOString();

    conversation.push({
      content: message,
      role: role, // 'user' or 'bot'
      timestamp,
      messageId: Date.now() + Math.random()
    });

    // Keep only recent messages to manage memory
    if (conversation.length > this.maxHistoryLength) {
      conversation.splice(0, conversation.length - this.maxHistoryLength);
    }

    this.conversations.set(userId, conversation);
  }

  /**
   * Get conversation history for context
   */
  getConversationHistory(userId) {
    const conversation = this.conversations.get(userId) || [];
    return conversation.slice(-this.maxHistoryLength);
  }

  /**
   * Update user profile for personalization
   */
  updateUserProfile(userId, profileData) {
    const existingProfile = this.userProfiles.get(userId) || { interests: [] };
    const updatedProfile = { ...existingProfile, ...profileData };
    this.userProfiles.set(userId, updatedProfile);
  }

  /**
   * Get user profile for personalized responses
   */
  getUserProfile(userId) {
    return this.userProfiles.get(userId) || { interests: [], name: null, mood: null };
  }

  /**
   * Analyze user interests from message content
   */
  analyzeUserInterests(userId, message) {
    const interestKeywords = {
      gaming: ['game', 'gaming', 'player', 'steam', 'xbox', 'playstation', 'nintendo', 'pc gaming'],
      anime: ['anime', 'manga', 'otaku', 'waifu', 'kawaii', 'senpai', 'cosplay'],
      coding: ['code', 'programming', 'developer', 'javascript', 'python', 'github', 'coding'],
      music: ['music', 'song', 'band', 'album', 'concert', 'guitar', 'piano', 'singing'],
      art: ['art', 'drawing', 'painting', 'design', 'creative', 'sketch', 'artist'],
      sports: ['sport', 'football', 'basketball', 'soccer', 'tennis', 'gym', 'workout', 'fitness'],
      movies: ['movie', 'film', 'cinema', 'actor', 'director', 'netflix', 'streaming'],
      books: ['book', 'reading', 'novel', 'author', 'literature', 'story', 'chapter']
    };

    const lowerMessage = message.toLowerCase();
    const interests = [];

    for (const [category, keywords] of Object.entries(interestKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        interests.push(category);
      }
    }

    return interests;
  }

  /**
   * Update user interests based on message content
   */
  updateUserInterests(userId, message) {
    const detectedInterests = this.analyzeUserInterests(userId, message);
    
    if (detectedInterests.length > 0) {
      const profile = this.getUserProfile(userId);
      const existingInterests = profile.interests || [];
      
      // Add new interests that aren't already known
      const newInterests = detectedInterests.filter(interest => 
        !existingInterests.includes(interest)
      );
      
      if (newInterests.length > 0) {
        this.updateUserProfile(userId, { 
          interests: [...existingInterests, ...newInterests] 
        });
      }
    }
  }

  /**
   * Clear all user data
   */
  clearUserData(userId) {
    this.conversations.delete(userId);
    this.userProfiles.delete(userId);
  }

  /**
   * Generate personalized context for AI
   */
  getPersonalizedContext(userId, message) {
    const profile = this.getUserProfile(userId);
    const interests = this.analyzeUserInterests(userId, message);
    const conversationHistory = this.getConversationHistory(userId);

    let personalContext = '';

    if (profile.interests && profile.interests.length > 0) {
      personalContext += `User's known interests: ${profile.interests.join(', ')}. `;
    }

    if (profile.name) {
      personalContext += `User prefers to be called: ${profile.name}. `;
    }

    if (profile.mood) {
      personalContext += `User's recent mood: ${profile.mood}. `;
    }

    return {
      personalContext,
      conversationHistory,
      currentInterests: interests
    };
  }

  /**
   * Clear old conversations to manage memory
   */
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [userId, conversation] of this.conversations.entries()) {
      const recentMessages = conversation.filter(msg => 
        new Date(msg.timestamp).getTime() > oneHourAgo
      );
      
      if (recentMessages.length === 0) {
        this.conversations.delete(userId);
      } else {
        this.conversations.set(userId, recentMessages);
      }
    }
  }
}
