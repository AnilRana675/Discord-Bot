import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'bot.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000');

// Initialize database schema
const initializeDatabase = () => {
  // User preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      favorite_personality TEXT DEFAULT 'gentle',
      language TEXT DEFAULT 'en',
      ai_model TEXT DEFAULT 'gpt-4o-mini',
      rate_limit_override INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Command usage statistics
  db.exec(`
    CREATE TABLE IF NOT EXISTS command_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      command_name TEXT NOT NULL,
      execution_time INTEGER NOT NULL,
      success BOOLEAN NOT NULL,
      error_message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_preferences(user_id)
    );
  `);

  // Conversation history (for context and analytics)
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      response TEXT NOT NULL,
      response_time INTEGER NOT NULL,
      personality TEXT,
      model_used TEXT,
      tokens_used INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_preferences(user_id)
    );
  `);

  // Security events log
  db.exec(`
    CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      user_id TEXT,
      severity TEXT DEFAULT 'info',
      details TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Performance metrics
  db.exec(`
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      context TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Bot configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database initialized successfully');
};

// Prepared statements for better performance
const statements = {
  // User preferences
  getUserPreferences: db.prepare('SELECT * FROM user_preferences WHERE user_id = ?'),
  setUserPreferences: db.prepare(`
    INSERT OR REPLACE INTO user_preferences 
    (user_id, favorite_personality, language, ai_model, updated_at) 
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `),
  
  // Command usage
  logCommandUsage: db.prepare(`
    INSERT INTO command_usage 
    (user_id, command_name, execution_time, success, error_message) 
    VALUES (?, ?, ?, ?, ?)
  `),
  
  getCommandStats: db.prepare(`
    SELECT 
      command_name,
      COUNT(*) as usage_count,
      AVG(execution_time) as avg_time,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count
    FROM command_usage 
    WHERE timestamp > datetime('now', '-7 days')
    GROUP BY command_name
    ORDER BY usage_count DESC
  `),
  
  // Conversation history
  saveConversation: db.prepare(`
    INSERT INTO conversation_history 
    (user_id, message, response, response_time, personality, model_used, tokens_used) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  
  getRecentConversations: db.prepare(`
    SELECT * FROM conversation_history 
    WHERE user_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `),
  
  // Security events
  logSecurityEvent: db.prepare(`
    INSERT INTO security_events 
    (event_type, user_id, severity, details, ip_address) 
    VALUES (?, ?, ?, ?, ?)
  `),
  
  // Performance metrics
  savePerformanceMetric: db.prepare(`
    INSERT INTO performance_metrics 
    (metric_name, metric_value, context) 
    VALUES (?, ?, ?)
  `),
  
  getPerformanceStats: db.prepare(`
    SELECT 
      metric_name,
      AVG(metric_value) as avg_value,
      MIN(metric_value) as min_value,
      MAX(metric_value) as max_value,
      COUNT(*) as sample_count
    FROM performance_metrics 
    WHERE timestamp > datetime('now', '-24 hours')
    GROUP BY metric_name
  `),
  
  // Bot configuration
  getConfig: db.prepare('SELECT value FROM bot_config WHERE key = ?'),
  setConfig: db.prepare('INSERT OR REPLACE INTO bot_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
};

// Database service class
export class DatabaseService {
  static initialize() {
    initializeDatabase();
  }

  // User preferences
  static getUserPreferences(userId) {
    return statements.getUserPreferences.get(userId);
  }

  static setUserPreferences(userId, preferences) {
    const { personality = 'gentle', language = 'en', aiModel = 'gpt-4o-mini' } = preferences;
    return statements.setUserPreferences.run(userId, personality, language, aiModel);
  }

  // Command usage tracking
  static logCommandUsage(userId, commandName, executionTime, success, errorMessage = null) {
    return statements.logCommandUsage.run(userId, commandName, executionTime, success, errorMessage);
  }

  static getCommandStats() {
    return statements.getCommandStats.all();
  }

  // Conversation history
  static saveConversation(userId, message, response, responseTime, personality, modelUsed, tokensUsed) {
    return statements.saveConversation.run(userId, message, response, responseTime, personality, modelUsed, tokensUsed);
  }

  static getRecentConversations(userId, limit = 5) {
    return statements.getRecentConversations.all(userId, limit);
  }

  // Security events
  static logSecurityEvent(eventType, userId, severity, details, ipAddress = null) {
    return statements.logSecurityEvent.run(eventType, userId, severity, JSON.stringify(details), ipAddress);
  }

  // Performance metrics
  static savePerformanceMetric(metricName, metricValue, context = null) {
    return statements.savePerformanceMetric.run(metricName, metricValue, JSON.stringify(context));
  }

  static getPerformanceStats() {
    return statements.getPerformanceStats.all();
  }

  // Configuration
  static getConfig(key) {
    const result = statements.getConfig.get(key);
    return result ? result.value : null;
  }

  static setConfig(key, value) {
    return statements.setConfig.run(key, value);
  }

  // Cleanup old data
  static cleanup() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Clean old command usage (keep 30 days)
    db.prepare('DELETE FROM command_usage WHERE timestamp < ?').run(thirtyDaysAgo);
    
    // Clean old conversation history (keep 7 days for non-premium users)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('DELETE FROM conversation_history WHERE timestamp < ?').run(sevenDaysAgo);
    
    // Clean old performance metrics (keep 7 days)
    db.prepare('DELETE FROM performance_metrics WHERE timestamp < ?').run(sevenDaysAgo);
    
    // Vacuum database to reclaim space
    db.pragma('vacuum');
    
    console.log('🧹 Database cleanup completed');
  }

  // Health check
  static healthCheck() {
    try {
      const result = db.prepare('SELECT 1 as health').get();
      return result && result.health === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Backup database
  static backup() {
    const backupPath = path.join(dataDir, `bot_backup_${Date.now()}.db`);
    db.backup(backupPath);
    console.log(`✅ Database backed up to: ${backupPath}`);
    return backupPath;
  }
}

// Initialize database on module load
DatabaseService.initialize();

// Graceful shutdown
process.on('exit', () => {
  db.close();
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

export { db, statements };
export default DatabaseService;
