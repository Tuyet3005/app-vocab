const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'vocabs.json');
const MARKED_FILE = path.join(DATA_DIR, 'marked.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(MARKED_FILE)) fs.writeFileSync(MARKED_FILE, JSON.stringify([], null, 2));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/vocabs', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'failed to read storage' });
    try {
      const vocabs = JSON.parse(data);
      res.json({ vocabs });
    } catch (e) {
      res.status(500).json({ error: 'invalid storage format' });
    }
  });
});

app.post('/api/vocabs', (req, res) => {
  const { vocabs } = req.body;
  if (!Array.isArray(vocabs)) return res.status(400).json({ error: 'vocabs must be an array' });
  fs.writeFile(DATA_FILE, JSON.stringify(vocabs, null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'failed to write storage' });
    res.json({ ok: true, vocabs });
  });
});

// Marked words: persist words the user wants to re-learn
app.get('/api/marked', (req, res) => {
  fs.readFile(MARKED_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'failed to read marked storage' });
    try {
      const marked = JSON.parse(data);
      res.json({ marked });
    } catch (e) {
      res.status(500).json({ error: 'invalid marked storage format' });
    }
  });
});

app.post('/api/marked', (req, res) => {
  const { word } = req.body; // expect { eng, vnm }
  if (!word || typeof word.eng !== 'string') return res.status(400).json({ error: 'word missing or invalid' });
  fs.readFile(MARKED_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'failed to read marked storage' });
    let marked = [];
    try { marked = JSON.parse(data); } catch (e) { marked = []; }
    // avoid duplicates: use eng + vnm as key
    const exists = marked.find(m => m.eng === word.eng && m.vnm === word.vnm);
    if (!exists) marked.push(word);
    fs.writeFile(MARKED_FILE, JSON.stringify(marked, null, 2), (err2) => {
      if (err2) return res.status(500).json({ error: 'failed to write marked storage' });
      res.json({ ok: true, marked });
    });
  });
});

// Clear all marked words
app.post('/api/marked/clear', (req, res) => {
  fs.writeFile(MARKED_FILE, JSON.stringify([], null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'failed to clear marked storage' });
    res.json({ ok: true, marked: [] });
  });
});

app.listen(3000, () => console.log('Server listening on http://localhost:3000'));
