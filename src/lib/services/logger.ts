export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? { message, ...meta } : { message };

  if (level === "error") {
    console.error(`[${level}]`, payload);
    return;
  }

  if (level === "warn") {
    console.warn(`[${level}]`, payload);
    return;
  }

  console.log(`[${level}]`, payload);
}

export function logError(message: string, error?: unknown, meta?: Record<string, unknown>) {
  const details =
    error instanceof Error
      ? { error: error.message, stack: error.stack }
      : error
        ? { error }
        : {};
  log("error", message, { ...meta, ...details });
}
