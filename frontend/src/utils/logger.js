/**
 * Centralized logging utility for the frontend.
 * Provides environment-based logging control and consistent formatting.
 */

const IS_PROD = import.meta.env.PROD;

const logger = {
  /**
   * Log informational messages. Silenced in production.
   */
  info: (message, ...args) => {
    if (!IS_PROD) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Log debug messages. Silenced in production.
   */
  debug: (message, ...args) => {
    if (!IS_PROD) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Log warnings. Always active.
   */
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  /**
   * Log errors. Always active.
   */
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
    
    // Future integration point: Sentry/Remote Logging
    // if (IS_PROD) {
    //   reportToRemoteService(message, args);
    // }
  }
};

export default logger;
