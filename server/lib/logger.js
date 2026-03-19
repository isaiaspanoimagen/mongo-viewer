import { existsSync, mkdirSync, appendFileSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, '..', 'logs');

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// ─── Log file paths ────────────────────────────────────────────────────────────

function getLogFileName() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
  return `server-${date}.log`;
}

function getLogFilePath() {
  return join(LOG_DIR, getLogFileName());
}

// ─── Formatting ────────────────────────────────────────────────────────────────

const LEVELS = {
  DEBUG: { label: 'DEBUG', color: '\x1b[90m' },
  INFO:  { label: 'INFO ', color: '\x1b[36m' },
  WARN:  { label: 'WARN ', color: '\x1b[33m' },
  ERROR: { label: 'ERROR', color: '\x1b[31m' },
  REQ:   { label: 'REQ  ', color: '\x1b[35m' },
  RES:   { label: 'RES  ', color: '\x1b[32m' },
  MONGO: { label: 'MONGO', color: '\x1b[33m' },
  SQL:   { label: 'SQL  ', color: '\x1b[34m' },
};

const RESET = '\x1b[0m';

function timestamp() {
  return new Date().toISOString();
}

function formatForConsole(level, category, message, data) {
  const { label, color } = LEVELS[level] || LEVELS.INFO;
  const ts = timestamp();
  const cat = category ? `[${category}]` : '';
  let line = `${color}${label}${RESET} ${'\x1b[90m'}${ts}${RESET} ${cat} ${message}`;
  if (data !== undefined) {
    line += ` ${'\x1b[90m'}${typeof data === 'string' ? data : JSON.stringify(data, null, 0)}${RESET}`;
  }
  return line;
}

function formatForFile(level, category, message, data) {
  const { label } = LEVELS[level] || LEVELS.INFO;
  const ts = timestamp();
  const cat = category ? `[${category}]` : '';
  let line = `${label} ${ts} ${cat} ${message}`;
  if (data !== undefined) {
    line += ` | ${typeof data === 'string' ? data : JSON.stringify(data)}`;
  }
  return line;
}

// ─── Core log function ─────────────────────────────────────────────────────────

function log(level, category, message, data) {
  // Console output (colored)
  console.log(formatForConsole(level, category, message, data));

  // File output (plain text)
  try {
    const fileLine = formatForFile(level, category, message, data);
    appendFileSync(getLogFilePath(), fileLine + '\n', 'utf-8');
  } catch {
    // If file write fails, at least console output worked
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const logger = {
  debug: (message, data) => log('DEBUG', null, message, data),
  info:  (message, data) => log('INFO', null, message, data),
  warn:  (message, data) => log('WARN', null, message, data),
  error: (message, data) => log('ERROR', null, message, data),

  req:   (message, data) => log('REQ', 'HTTP', message, data),
  res:   (message, data) => log('RES', 'HTTP', message, data),

  mongo: (message, data) => log('MONGO', 'MongoDB', message, data),
  sql:   (message, data) => log('SQL', 'SQLite', message, data),

  // Category-scoped child logger
  child: (category) => ({
    debug: (message, data) => log('DEBUG', category, message, data),
    info:  (message, data) => log('INFO', category, message, data),
    warn:  (message, data) => log('WARN', category, message, data),
    error: (message, data) => log('ERROR', category, message, data),
  }),
};

// ─── Express middleware ────────────────────────────────────────────────────────

export function requestLogger() {
  return (req, res, next) => {
    const start = Date.now();
    const { method, url } = req;

    logger.req(`${method} ${url}`, req.body && Object.keys(req.body).length > 0
      ? { body: sanitizeBody(req.body) }
      : undefined
    );

    // Capture response
    const originalSend = res.send;
    res.send = function (body) {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const level = status >= 400 ? 'ERROR' : 'RES';

      log(level, 'HTTP', `${method} ${url} → ${status} (${duration}ms)`, 
        status >= 400 && body ? tryParseError(body) : undefined
      );

      return originalSend.call(this, body);
    };

    next();
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Hide sensitive fields like URIs and passwords in logs */
function sanitizeBody(body) {
  const sanitized = { ...body };
  if (sanitized.uri) {
    sanitized.uri = sanitized.uri.replace(/:\/\/([^@]*)@/, '://***@');
  }
  if (sanitized.password) {
    sanitized.password = '***';
  }
  return sanitized;
}

function tryParseError(body) {
  try {
    const parsed = JSON.parse(body);
    return parsed.error || parsed.message || undefined;
  } catch {
    return undefined;
  }
}

export default logger;
