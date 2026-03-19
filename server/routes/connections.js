import { Router } from 'express';
import {
  saveConnection,
  getConnections,
  deleteConnection,
  getConnectionById,
} from '../db/sqlite.js';
import {
  testConnection,
  connect,
  disconnect,
  isConnected,
} from '../mongo/client.js';

const router = Router();

// List all saved connections
router.get('/', (req, res) => {
  try {
    const connections = getConnections();
    const result = connections.map((c) => ({
      ...c,
      connected: isConnected(c.id),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test a MongoDB URI (without saving)
router.post('/test', async (req, res) => {
  const { uri } = req.body;
  if (!uri) return res.status(400).json({ error: 'URI is required' });

  try {
    const info = await testConnection(uri);
    res.json({ success: true, info });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Save a new connection
router.post('/', (req, res) => {
  const { name, uri } = req.body;
  if (!name || !uri) {
    return res.status(400).json({ error: 'Name and URI are required' });
  }

  try {
    const connection = saveConnection(name, uri);
    res.status(201).json(connection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a connection
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    // Disconnect if active
    if (isConnected(id)) {
      await disconnect(id);
    }
    deleteConnection(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect to a saved connection
router.post('/:id/connect', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const conn = getConnectionById(id);
    if (!conn) return res.status(404).json({ error: 'Connection not found' });

    await connect(id, conn.uri);
    res.json({ success: true, id, name: conn.name });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Disconnect from a connection
router.post('/:id/disconnect', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    await disconnect(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
