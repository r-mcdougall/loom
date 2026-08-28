import { env } from "../env";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProduction = env.NODE_ENV === "production";
const threshold = LEVEL_PRIORITY[env.LOG_LEVEL];

/**
 * Keys that must never reach the logs, matched case-insensitively. We never log
 * request/response bodies, so this is a second line of defence for callers that
 * pass structured fields explicitly.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "accesstoken",
  "refreshtoken",
  "tokenhash",
  "authorization",
  "cookie",
  "secret",
  "jwt",
]);

const COLOR: Record<LogLevel, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

function sanitize(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[redacted]" : value;
  }
  return out;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return /[\s"]/.test(value) ? JSON.stringify(value) : value;
  }
  if (value instanceof Error) return JSON.stringify(value.message);
  return String(value);
}

function emit(level: LogLevel, message: string, fields?: LogFields): void {
  if (LEVEL_PRIORITY[level] < threshold) return;

  const safe = fields ? sanitize(fields) : {};
  const sink = level === "warn" || level === "error" ? console.error : console.log;

  if (isProduction) {
    // One JSON object per line -> easy to ship & parse.
    sink(JSON.stringify({ level, time: new Date().toISOString(), message, ...safe }));
    return;
  }

  // Dev: compact, human-readable single line.
  const time = new Date().toISOString().slice(11, 23);
  const entries = Object.entries(safe);
  const tail = entries.length
    ? " " + entries.map(([k, v]) => `${k}=${formatValue(v)}`).join(" ")
    : "";
  sink(`${COLOR[level]}${time} ${level.toUpperCase().padEnd(5)}${RESET} ${message}${tail}`);
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
