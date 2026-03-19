import { Router } from 'express';
import { listDatabases, listCollections } from '../mongo/client.js';

const router = Router();

// List all databases for a connection
router.get('/:connectionId/databases', async (req, res) => {
  const connectionId = parseInt(req.params.connectionId, 10);
  try {
    const databases = await listDatabases(connectionId);
    res.json(databases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all collections in a database
router.get('/:connectionId/databases/:dbName/collections', async (req, res) => {
  const connectionId = parseInt(req.params.connectionId, 10);
  const { dbName } = req.params;
  try {
    const collections = await listCollections(connectionId, dbName);
    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
