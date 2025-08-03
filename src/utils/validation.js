// Enhanced input validation and sanitization
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export class InputValidator {
  static sanitizeInput(input, options = {}) {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input type');
    }

    const {
      maxLength = 2000,
      allowHtml = false,
      allowMarkdown = true,
      stripEmojis = false
    } = options;

    // Basic length check
    if (input.length > maxLength) {
      throw new Error(`Input too long. Maximum ${maxLength} characters allowed.`);
    }

    let sanitized = input.trim();

    // Remove potentially dangerous content
    if (!allowHtml) {
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
    }

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Check for malicious patterns
    const maliciousPatterns = [
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /<script/gi,
      /on\w+=/gi
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(sanitized)) {
        throw new Error('Input contains potentially malicious content');
      }
    }

    // Validate against common injection attempts
    if (validator.contains(sanitized, 'DROP TABLE') || 
        validator.contains(sanitized, 'SELECT * FROM') ||
        validator.contains(sanitized, 'UNION SELECT')) {
      throw new Error('Input contains SQL injection patterns');
    }

    return sanitized;
  }

  static validateDiscordMention(input) {
    const mentionPattern = /^<[@#&!]([0-9]{17,19})>$/;
    return mentionPattern.test(input);
  }

  static validateUrl(url) {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: false,
      host_whitelist: ['discord.com', 'github.com', 'githubusercontent.com']
    });
  }

  static rateLimit = new Map();

  static checkSpamProtection(userId, content) {
    const now = Date.now();
    const userHistory = this.rateLimit.get(userId) || [];
    
    // Remove old entries (older than 1 minute)
    const recentHistory = userHistory.filter(entry => now - entry.timestamp < 60000);
    
    // Check for duplicate content spam
    const duplicateCount = recentHistory.filter(entry => entry.content === content).length;
    if (duplicateCount >= 3) {
      throw new Error('Spam detected: Too many identical messages');
    }
    
    // Check for rate limiting (max 15 messages per minute)
    if (recentHistory.length >= 15) {
      throw new Error('Rate limit exceeded: Too many messages');
    }
    
    // Add current message to history
    recentHistory.push({ content, timestamp: now });
    this.rateLimit.set(userId, recentHistory);
    
    return true;
  }
}

export const sanitizeInput = InputValidator.sanitizeInput;
export const validateUrl = InputValidator.validateUrl;
export const checkSpamProtection = InputValidator.checkSpamProtection;
