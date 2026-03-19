import { MongoClient } from 'mongodb';

/**
 * MongoVista — MongoDB Connection Pool Manager
 *
 * Keeps a map of active MongoClient instances keyed by connection ID.
 * Provides helpers to connect, disconnect, list databases, list collections,
 * and paginate documents.
 */

/** @type {Map<number, MongoClient>} */
const pool = new Map();

// ─── Connection Management ─────────────────────────────────────────────────────

/**
 * Test a MongoDB URI without caching the client.
 * Returns server info on success, throws on failure.
 */
export async function testConnection(uri) {
  const client = new MongoClient(uri, {
    connectTimeoutMS: 10_000,
    serverSelectionTimeoutMS: 10_000,
  });
  try {
    await client.connect();
    const admin = client.db().admin();
    const info = await admin.serverStatus();
    return {
      host: info.host,
      version: info.version,
      uptime: info.uptime,
    };
  } finally {
    await client.close();
  }
}

/**
 * Open a persistent connection and cache it.
 */
export async function connect(connectionId, uri) {
  // Close previous connection if exists
  if (pool.has(connectionId)) {
    await pool.get(connectionId).close();
  }

  const client = new MongoClient(uri, {
    connectTimeoutMS: 10_000,
    serverSelectionTimeoutMS: 10_000,
  });
  await client.connect();
  pool.set(connectionId, client);
  return true;
}

/**
 * Retrieve a cached MongoClient.
 */
export function getClient(connectionId) {
  const client = pool.get(connectionId);
  if (!client) {
    throw new Error(`No active connection for id ${connectionId}`);
  }
  return client;
}

/**
 * Close and remove a cached connection.
 */
export async function disconnect(connectionId) {
  const client = pool.get(connectionId);
  if (client) {
    await client.close();
    pool.delete(connectionId);
  }
}

/**
 * Check if a connection is active.
 */
export function isConnected(connectionId) {
  return pool.has(connectionId);
}

// ─── Database & Collection Browsing ────────────────────────────────────────────

export async function listDatabases(connectionId) {
  const client = getClient(connectionId);
  const admin = client.db().admin();
  const result = await admin.listDatabases();
  return result.databases.map((db) => ({
    name: db.name,
    sizeOnDisk: db.sizeOnDisk,
    empty: db.empty,
  }));
}

export async function listCollections(connectionId, dbName) {
  const client = getClient(connectionId);
  const db = client.db(dbName);
  const collections = await db.listCollections().toArray();
  return collections.map((c) => ({
    name: c.name,
    type: c.type,
  }));
}

// ─── Document Queries ──────────────────────────────────────────────────────────

/**
 * Fetch paginated documents from a collection.
 * Uses skip/limit for cursor-based pagination.
 */
export async function getDocuments(connectionId, dbName, collectionName, options = {}) {
  const { page = 1, pageSize = 50, filter = {}, sort = { _id: -1 } } = options;
  const client = getClient(connectionId);
  const collection = client.db(dbName).collection(collectionName);

  const skip = (page - 1) * pageSize;

  const [documents, totalCount] = await Promise.all([
    collection.find(filter).sort(sort).skip(skip).limit(pageSize).toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    documents: serializeDocuments(documents),
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Get collection stats (document count, avg size, etc.).
 */
export async function getCollectionStats(connectionId, dbName, collectionName) {
  const client = getClient(connectionId);
  const db = client.db(dbName);
  const stats = await db.command({ collStats: collectionName });
  return {
    count: stats.count,
    size: stats.size,
    avgObjSize: stats.avgObjSize,
    storageSize: stats.storageSize,
    indexes: stats.nindexes,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Serialize MongoDB documents for JSON transport.
 * Converts ObjectId, Date, Binary, etc. to strings.
 */
function serializeDocuments(docs) {
  return JSON.parse(
    JSON.stringify(docs, (key, value) => {
      if (value && typeof value === 'object') {
        // ObjectId
        if (value._bsontype === 'ObjectId' || value._bsontype === 'ObjectID') {
          return value.toString();
        }
        // Binary
        if (value._bsontype === 'Binary') {
          return `<Binary: ${value.length()} bytes>`;
        }
        // Decimal128
        if (value._bsontype === 'Decimal128') {
          return value.toString();
        }
      }
      return value;
    })
  );
}

/**
 * Disconnect all active connections (for graceful shutdown).
 */
export async function disconnectAll() {
  const promises = [];
  for (const [id, client] of pool) {
    promises.push(client.close());
  }
  await Promise.all(promises);
  pool.clear();
}
