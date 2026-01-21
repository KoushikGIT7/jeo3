/**
 * Centralized Error Logging Utility
 * Lightweight, non-blocking error logging for production
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: number;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 100; // Keep last 100 logs in memory

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: Date.now(),
      error
    };

    // Add to in-memory buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest
    }

    // Console output (non-blocking)
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    const prefix = `[${level.toUpperCase()}]`;
    
    if (error) {
      logFn(prefix, message, { ...context, error: error.message, stack: error.stack });
    } else {
      logFn(prefix, message, context || {});
    }
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, context, error);
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(level?: LogLevel, limit: number = 20): LogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = this.logs.filter(log => log.level === level);
    }
    return filtered.slice(-limit);
  }

  /**
   * Clear logs (for testing)
   */
  clear(): void {
    this.logs = [];
  }
}

// Singleton instance
export const logger = new Logger();

// Export convenience functions
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context);
export const logWarn = (message: string, context?: Record<string, any>) => logger.warn(message, context);
export const logError = (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context);
