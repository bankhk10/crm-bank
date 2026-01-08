/**
 * Application Logger
 * Logger หลักสำหรับ Application Logs
 */

import { db as prisma } from "@/lib/db";
import { getLoggerConfig } from "./config";
import { LogEntry, LogLevel, RequestContext } from "./types";
import {
  formatDuration,
  generateRequestId,
  maskSensitiveData,
  safeStringify,
} from "./utils";

// Log level hierarchy
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// ANSI color codes for console output
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: COLORS.dim + COLORS.cyan,
  info: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.red,
  fatal: COLORS.bgRed + COLORS.white + COLORS.bright,
};

class ApplicationLogger {
  private config = getLoggerConfig();
  private context: RequestContext = {};

  /**
   * Create a child logger with context
   */
  child(context: Partial<RequestContext>): ApplicationLogger {
    const childLogger = new ApplicationLogger();
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  /**
   * Set request context
   */
  setContext(context: Partial<RequestContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * Format log entry for console output
   */
  private formatConsoleOutput(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const color = LEVEL_COLORS[entry.level];
    const levelPadded = entry.level.toUpperCase().padEnd(5);

    let output = `${COLORS.dim}${timestamp}${COLORS.reset} ${color}${levelPadded}${COLORS.reset}`;

    if (entry.module) {
      output += ` ${COLORS.cyan}[${entry.module}]${COLORS.reset}`;
    }

    if (entry.functionName) {
      output += ` ${COLORS.magenta}${entry.functionName}${COLORS.reset}`;
    }

    output += ` ${entry.message}`;

    if (entry.duration !== undefined) {
      output += ` ${COLORS.dim}(${formatDuration(entry.duration)})${
        COLORS.reset
      }`;
    }

    if (entry.requestId) {
      output += ` ${COLORS.dim}reqId=${entry.requestId}${COLORS.reset}`;
    }

    if (entry.error) {
      output += `\n${COLORS.red}${entry.error.name}: ${entry.error.message}${COLORS.reset}`;
      if (entry.error.stack) {
        output += `\n${COLORS.dim}${entry.error.stack}${COLORS.reset}`;
      }
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      const maskedMetadata = maskSensitiveData(
        entry.metadata as Record<string, unknown>
      );
      output += `\n${COLORS.dim}${safeStringify(maskedMetadata)}${
        COLORS.reset
      }`;
    }

    return output;
  }

  /**
   * Write log to console
   */
  private writeToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const output = this.formatConsoleOutput(entry);

    switch (entry.level) {
      case "debug":
        console.debug(output);
        break;
      case "info":
        console.info(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
      case "fatal":
        console.error(output);
        break;
    }
  }

  /**
   * Write log to database (for production)
   */
  private async writeToDatabase(entry: LogEntry): Promise<void> {
    if (!this.config.enableDatabase) return;

    try {
      const levelMap: Record<
        LogLevel,
        "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL"
      > = {
        debug: "DEBUG",
        info: "INFO",
        warn: "WARN",
        error: "ERROR",
        fatal: "CRITICAL",
      };

      await prisma.applicationLog.create({
        data: {
          level: levelMap[entry.level],
          message: entry.message,
          module: entry.module,
          functionName: entry.functionName,
          requestId: entry.requestId || this.context.requestId,
          userId: entry.userId || this.context.userId,
          sessionId: this.context.sessionId,
          errorName: entry.error?.name,
          errorMessage: entry.error?.message,
          stackTrace: entry.error?.stack,
          metadata: entry.metadata
            ? (maskSensitiveData(
                entry.metadata as Record<string, unknown>
              ) as object)
            : undefined,
          duration: entry.duration,
        },
      });
    } catch (error) {
      // Fallback to console if database write fails
      console.error("Failed to write log to database:", error);
    }
  }

  /**
   * Core log method
   */
  private async log(
    level: LogLevel,
    message: string,
    meta?: Partial<Omit<LogEntry, "level" | "message">>
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      requestId: this.context.requestId || generateRequestId(),
      userId: this.context.userId,
      sessionId: this.context.sessionId,
      ...meta,
    };

    // Write to console (sync)
    this.writeToConsole(entry);

    // Write to database (async, don't await in non-critical paths)
    if (level === "error" || level === "fatal") {
      // Await for critical logs
      await this.writeToDatabase(entry);
    } else {
      // Fire and forget for non-critical logs
      this.writeToDatabase(entry).catch(() => {});
    }
  }

  // Public logging methods
  debug(
    message: string,
    meta?: Partial<Omit<LogEntry, "level" | "message">>
  ): void {
    this.log("debug", message, meta);
  }

  info(
    message: string,
    meta?: Partial<Omit<LogEntry, "level" | "message">>
  ): void {
    this.log("info", message, meta);
  }

  warn(
    message: string,
    meta?: Partial<Omit<LogEntry, "level" | "message">>
  ): void {
    this.log("warn", message, meta);
  }

  error(
    message: string,
    error?: Error | unknown,
    meta?: Partial<Omit<LogEntry, "level" | "message">>
  ): void {
    const errorInfo =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error
        ? { name: "Error", message: String(error) }
        : undefined;

    this.log("error", message, { ...meta, error: errorInfo });
  }

  fatal(
    message: string,
    error?: Error | unknown,
    meta?: Partial<Omit<LogEntry, "level" | "message">>
  ): void {
    const errorInfo =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error
        ? { name: "Error", message: String(error) }
        : undefined;

    this.log("fatal", message, { ...meta, error: errorInfo });
  }

  /**
   * Log with timing
   */
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`${label} completed`, { duration });
    };
  }

  /**
   * Wrap an async function with timing
   */
  async timed<T>(
    label: string,
    fn: () => Promise<T>,
    meta?: Partial<Omit<LogEntry, "level" | "message">>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`${label} completed`, { ...meta, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed`, error, { ...meta, duration });
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new ApplicationLogger();

// Export class for creating child loggers
export { ApplicationLogger };
