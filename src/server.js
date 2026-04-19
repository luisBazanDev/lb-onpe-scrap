import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, '../db.json');

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Load database
function loadDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    return null;
  }
  const content = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(content);
}

// API Routes
app.get('/api/summary', (req, res) => {
  const db = loadDatabase();
  if (!db) {
    return res.status(404).json({ error: 'Database not found. Run bulk-data script first.' });
  }
  res.json(db.summary);
});

app.get('/api/partidos', (req, res) => {
  const db = loadDatabase();
  if (!db) {
    return res.status(404).json({ error: 'Database not found. Run bulk-data script first.' });
  }
  
  // Filter to only parties with votes and sort by votes
  const partidos = Object.values(db.partidos)
    .filter(party => party.totalVotos > 0)
    .sort((a, b) => b.totalVotos - a.totalVotos);
  
  res.json(partidos);
});

app.get('/api/mesas', (req, res) => {
  const db = loadDatabase();
  if (!db) {
    return res.status(404).json({ error: 'Database not found. Run bulk-data script first.' });
  }
  res.json(db.mesas);
});

app.get('/api/regiones', (req, res) => {
  const db = loadDatabase();
  if (!db) {
    return res.status(404).json({ error: 'Database not found. Run bulk-data script first.' });
  }
  
  const regiones = Object.values(db.regionesDetalle)
    .sort((a, b) => b.totalVotosValidos - a.totalVotosValidos);
  
  res.json(regiones);
});

app.get('/api/metadata', (req, res) => {
  const db = loadDatabase();
  if (!db) {
    return res.status(404).json({ error: 'Database not found. Run bulk-data script first.' });
  }
  res.json(db.metadata);
});

app.get('/api/errores', (req, res) => {
  const db = loadDatabase();
  if (!db) {
    return res.status(404).json({ error: 'Database not found. Run bulk-data script first.' });
  }
  res.json(db.errores);
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🗳️  ONPE Voting Transparency Server running on http://localhost:${PORT}`);
  console.log('\nTo collect data, run: npm run bulk-data');
  console.log('To force restart data collection: npm run bulk-data:force\n');
});
