import { Router } from 'express';
import { getDocuments, getCollectionStats } from '../mongo/client.js';
import { addQueryHistory } from '../db/sqlite.js';

const router = Router();

// Get paginated documents from a collection
router.get('/:connectionId/:dbName/:collection', async (req, res) => {
  const connectionId = parseInt(req.params.connectionId, 10);
  const { dbName, collection } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 50, 200);

  try {
    // Parse optional filter from query string
    let filter = {};
    if (req.query.filter) {
      try {
        filter = JSON.parse(req.query.filter);
      } catch {
        return res.status(400).json({ error: 'Invalid filter JSON' });
      }
    }

    // Parse optional sort
    let sort = { _id: -1 };
    if (req.query.sort) {
      try {
        sort = JSON.parse(req.query.sort);
      } catch {
        return res.status(400).json({ error: 'Invalid sort JSON' });
      }
    }

    const result = await getDocuments(connectionId, dbName, collection, {
      page,
      pageSize,
      filter,
      sort,
    });

    // Log to query history
    addQueryHistory(
      connectionId,
      dbName,
      collection,
      JSON.stringify({ filter, sort, page, pageSize })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get collection stats
router.get('/:connectionId/:dbName/:collection/stats', async (req, res) => {
  const connectionId = parseInt(req.params.connectionId, 10);
  const { dbName, collection } = req.params;

  try {
    const stats = await getCollectionStats(connectionId, dbName, collection);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
