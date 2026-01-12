export interface LogEntry {
  timestamp: string;
  level: "info" | "error" | "warn" | "debug";
  action: string;
  userId?: string;
  tenantId?: string;
  invoiceId?: string;
  data?: Record<string, any>;
  error?: string;
  context?: string;
}

class Logger {
  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private createLogEntry(
    level: LogEntry["level"],
    action: string,
    data?: Record<string, any>,
    error?: string | Error,
    context?: Record<string, string>,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      data,
      ...(context && { context: JSON.stringify(context) }),
    };

    if (error) {
      entry.error = error instanceof Error ? error.message : error;
    }

    return entry;
  }

  info(
    action: string,
    data?: Record<string, any>,
    context?: Record<string, string>,
  ) {
    const entry = this.createLogEntry("info", action, data, undefined, context);
    console.log(this.formatLogEntry(entry));
  }

  error(
    action: string,
    error?: string | Error,
    data?: Record<string, any>,
    context?: Record<string, string>,
  ) {
    const entry = this.createLogEntry("error", action, data, error, context);
    console.error(this.formatLogEntry(entry));
  }

  warn(
    action: string,
    data?: Record<string, any>,
    context?: Record<string, string>,
  ) {
    const entry = this.createLogEntry("warn", action, data, undefined, context);
    console.warn(this.formatLogEntry(entry));
  }

  debug(
    action: string,
    data?: Record<string, any>,
    context?: Record<string, string>,
  ) {
    const entry = this.createLogEntry(
      "debug",
      action,
      data,
      undefined,
      context,
    );
    console.debug(this.formatLogEntry(entry));
  }
}

export const logger = new Logger();
