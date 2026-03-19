import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { disconnectAll } from './mongo/client.js';
import logger, { requestLogger } from './lib/logger.js';

// Routes
import connectionsRouter from './routes/connections.js';
import databasesRouter from './routes/databases.js';
import documentsRouter from './routes/documents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../.env');
config({ path: rootEnvPath });

const app = express();
function getPortFromArgs(argv) {
  const portFlagIndex = argv.findIndex((arg) => arg === '--port' || arg === '-p');
  if (portFlagIndex === -1) return null;

  const rawPort = argv[portFlagIndex + 1];
  const parsedPort = Number(rawPort);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    logger.warn(`Invalid port flag value "${rawPort}". Falling back to env/default port.`);
    return null;
  }

  return parsedPort;
}

const argPort = getPortFromArgs(process.argv.slice(2));
const envPort = Number(process.env.PORT);
const PORT = argPort || (Number.isInteger(envPort) && envPort > 0 ? envPort : 3001);

// ─── Middleware ─────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(requestLogger());

// ─── Routes ─────────────────────────────────────────────────────────────────────

app.use('/api/connections', connectionsRouter);
app.use('/api/explore', databasesRouter);
app.use('/api/documents', documentsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start Server ───────────────────────────────────────────────────────────────

logger.info('Starting MongoVista server...');

app.listen(PORT, () => {
  logger.info(`🟢 MongoVista API running on http://localhost:${PORT}`);
  logger.info(`📁 Logs directory: ./logs/`);
  logger.info(`💾 SQLite database: ./data/mongo-vista.db`);
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────────

async function shutdown() {
  logger.warn('Shutting down gracefully...');
  await disconnectAll();
  logger.info('All connections closed. Goodbye!');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});
