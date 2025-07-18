import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to history file
const historyFilePath = path.join(__dirname, 'public', 'history.json');

// GET endpoint to read history
app.get('/api/history', async (req, res) => {
  try {
    const data = await fs.readFile(historyFilePath, 'utf8');
    const history = JSON.parse(data);
    res.json(history);
  } catch (error) {
    // If file doesn't exist, return empty array
    console.log('No history file found, returning empty array');
    res.json([]);
  }
});

// POST endpoint to save history
app.post('/api/history', async (req, res) => {
  try {
    const { history } = req.body;
    
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'History must be an array' });
    }
    
    // Ensure public directory exists
    const publicDir = path.join(__dirname, 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    // Write to file
    await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2));
    
    console.log(`✅ Saved ${history.length} items to public/history.json`);
    res.json({ success: true, message: 'History saved successfully', count: history.length });
  } catch (error) {
    console.error('❌ Error saving history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 History file: ${historyFilePath}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET  /api/history - Read history`);
  console.log(`   POST /api/history - Save history`);
  console.log(`   GET  /api/health  - Health check`);
});