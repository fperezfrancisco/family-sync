/**
 * Centralized Debug Logger for Socket.IO and Message Operations
 *
 * Provides structured logging with the ability to enable/disable
 * different log categories. Logs can be viewed in browser console
 * and optionally sent to external monitoring services.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogCategory =
  | "connection"
  | "message"
  | "browser"
  | "persistence"
  | "performance"
  | "error";

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, unknown>;
  browserInfo?: string;
}

class DebugLogger {
  private enabled: boolean = false;
  private categories: Set<LogCategory> = new Set();
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private browserInfo: string = "";

  constructor() {
    // Check if debugging is enabled via localStorage
    this.enabled = localStorage.getItem("family-sync-debug") === "true";

    // Load enabled categories from localStorage
    const savedCategories = localStorage.getItem(
      "family-sync-debug-categories"
    );
    if (savedCategories) {
      try {
        const categories = JSON.parse(savedCategories);
        this.categories = new Set(categories);
      } catch {
        // Default to all categories if parsing fails
        this.categories = new Set([
          "connection",
          "message",
          "browser",
          "persistence",
          "performance",
          "error",
        ]);
      }
    } else {
      // Default categories when debug is enabled
      this.categories = new Set(["connection", "message", "error"]);
    }

    // Set browser info for all logs
    if (typeof window !== "undefined") {
      this.browserInfo = navigator.userAgent;
    }

    // Expose logger to window for easy debugging
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).familySyncDebugger = this;
    }
  }

  /**
   * Enable/disable debugging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem("family-sync-debug", enabled.toString());

    if (enabled) {
      console.log("🐛 Family Sync Debug Logger: ENABLED");
      console.log("🔧 Available commands:");
      console.log('  window.familySyncDebugger.enableCategory("category")');
      console.log('  window.familySyncDebugger.disableCategory("category")');
      console.log("  window.familySyncDebugger.getLogs()");
      console.log("  window.familySyncDebugger.clearLogs()");
      console.log("  window.familySyncDebugger.exportLogs()");
    } else {
      console.log("🐛 Family Sync Debug Logger: DISABLED");
    }
  }

  /**
   * Enable a specific log category
   */
  enableCategory(category: LogCategory): void {
    this.categories.add(category);
    this.saveCategories();
    console.log(`🐛 Debug category '${category}' enabled`);
  }

  /**
   * Disable a specific log category
   */
  disableCategory(category: LogCategory): void {
    this.categories.delete(category);
    this.saveCategories();
    console.log(`🐛 Debug category '${category}' disabled`);
  }

  /**
   * Save enabled categories to localStorage
   */
  private saveCategories(): void {
    localStorage.setItem(
      "family-sync-debug-categories",
      JSON.stringify([...this.categories])
    );
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.enabled || !this.categories.has(category)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      browserInfo: this.browserInfo,
    };

    // Add to internal log storage
    this.logs.push(entry);

    // Keep logs within limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Format for console output
    const emoji = this.getEmojiForCategory(category);
    const timestamp = new Date(entry.timestamp).toISOString().slice(11, 23); // HH:mm:ss.SSS
    const prefix = `${emoji} [${timestamp}] [${category.toUpperCase()}]`;

    // Console output based on level
    switch (level) {
      case "debug":
        console.debug(prefix, message, data || "");
        break;
      case "info":
        console.log(prefix, message, data || "");
        break;
      case "warn":
        console.warn(prefix, message, data || "");
        break;
      case "error":
        console.error(prefix, message, data || "");
        break;
    }
  }

  /**
   * Get emoji for log category for easier visual scanning
   */
  private getEmojiForCategory(category: LogCategory): string {
    switch (category) {
      case "connection":
        return "🔌";
      case "message":
        return "💬";
      case "browser":
        return "🌐";
      case "persistence":
        return "💾";
      case "performance":
        return "⚡";
      case "error":
        return "🚨";
      default:
        return "📝";
    }
  }

  // Public logging methods
  debug(
    category: LogCategory,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.log("debug", category, message, data);
  }

  info(
    category: LogCategory,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.log("info", category, message, data);
  }

  warn(
    category: LogCategory,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.log("warn", category, message, data);
  }

  error(
    category: LogCategory,
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.log("error", category, message, data);
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = [];
    console.log("🐛 Debug logs cleared");
  }

  /**
   * Export logs as JSON for analysis or bug reports
   */
  exportLogs(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      browserInfo: this.browserInfo,
      logs: this.logs,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);

    // Also copy to clipboard if possible
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        console.log("🐛 Debug logs exported and copied to clipboard");
      });
    }

    return jsonStr;
  }

  /**
   * Get current debugging status
   */
  getStatus(): { enabled: boolean; categories: string[] } {
    return {
      enabled: this.enabled,
      categories: [...this.categories],
    };
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger();

// Convenience functions for common use cases
export const logConnection = (
  message: string,
  data?: Record<string, unknown>
) => debugLogger.info("connection", message, data);

export const logMessage = (message: string, data?: Record<string, unknown>) =>
  debugLogger.info("message", message, data);

export const logBrowser = (message: string, data?: Record<string, unknown>) =>
  debugLogger.info("browser", message, data);

export const logPersistence = (
  message: string,
  data?: Record<string, unknown>
) => debugLogger.info("persistence", message, data);

export const logPerformance = (
  message: string,
  data?: Record<string, unknown>
) => debugLogger.info("performance", message, data);

export const logError = (message: string, data?: Record<string, unknown>) =>
  debugLogger.error("error", message, data);

// Enable debugging by default in development
if (process.env.NODE_ENV === "development") {
  debugLogger.setEnabled(true);
}

export default debugLogger;
