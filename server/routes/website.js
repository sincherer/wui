import express from 'express';
import cors from 'cors';
import { validateWebsiteId } from '../middleware/validation.js';

const router = express.Router();
router.use(cors());

router.get('/:websiteId/editor', validateWebsiteId, async (req, res) => {
  try {
    const { websiteId } = req.params;
    // TODO: Add database lookup and editor configuration loading
    res.status(200).json({ 
      status: 'editor_loaded',
      websiteId,
      configuration: {}
    });
  } catch (error) {
    console.error('Editor endpoint error:', error);
    res.status(500).json({ error: 'Failed to load editor configuration' });
  }
});

export default router;