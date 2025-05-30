//server.js
import express from 'express';
import cors from 'cors';
import peer from './peer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable JSON body parsing and CORS for all origins
app.use(express.json());
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve frontend.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Set a key-value
app.post('/set', async (req, res) => {
  const { key, value } = req.body;
  try {
    await peer.set(key, value);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a value by key
app.get('/get/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const value = await peer.get(key);
    res.json({ key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get configuration
app.get('/config', async (req, res) => {
  try {
    const config = await peer.getConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of peers
app.get('/peers', async (req, res) => {
  try {
    const peers = await peer.getPeers();
    res.json(peers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/trustedpeers', async(req, res) => {
  try{
    const tpeers = await peer.loadTrustedCertificates();
    res.json(tpeers);
  }
  catch (err) {
    res.status(500).json({ error: err.messagge });
  }
});

// Get current synchronized time
app.get('/time', async (req, res) => {
  try {
    const time = peer.getCurrentTime();
    res.json({ time: new Date(time).toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Load config and start server
const config = JSON.parse(await fs.readFile('./config.json', 'utf8'));
const port = config.dbServerPort;

app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});
