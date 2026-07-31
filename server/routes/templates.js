import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { templatesDir, PLACEHOLDER_REFERENCE } from '../documentGenerator.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — plenty for a Word doc, keeps uploads bounded
  fileFilter: (req, file, cb) => {
    const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || file.originalname.toLowerCase().endsWith('.docx');
    cb(isDocx ? null : new Error('Only .docx files are supported'), isDocx);
  },
});

// GET /api/templates/placeholders — reference list of tags templates can use
router.get('/placeholders', (req, res) => {
  res.json(PLACEHOLDER_REFERENCE);
});

// GET /api/templates
router.get('/', (req, res) => {
  const templates = db.prepare(
    'SELECT id, country, original_filename, uploaded_at FROM franchise_templates ORDER BY country, uploaded_at DESC'
  ).all();
  res.json(templates);
});

// POST /api/templates — upload a new template (multipart: country, file)
router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'A .docx file is required' });

    const country = (req.body?.country || '').trim();
    if (!country) return res.status(400).json({ error: 'country is required' });

    const storedFilename = `${crypto.randomUUID()}.docx`;
    fs.mkdirSync(templatesDir, { recursive: true });
    fs.writeFileSync(path.join(templatesDir, storedFilename), req.file.buffer);

    const result = db.prepare(`
      INSERT INTO franchise_templates (country, original_filename, stored_filename)
      VALUES (?, ?, ?)
    `).run(country, req.file.originalname, storedFilename);

    res.status(201).json(
      db.prepare('SELECT id, country, original_filename, uploaded_at FROM franchise_templates WHERE id = ?').get(result.lastInsertRowid)
    );
  });
});

// DELETE /api/templates/:id
router.delete('/:id', (req, res) => {
  const template = db.prepare('SELECT * FROM franchise_templates WHERE id = ?').get(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  db.prepare('DELETE FROM franchise_templates WHERE id = ?').run(req.params.id);
  fs.rm(path.join(templatesDir, template.stored_filename), { force: true }, () => {});

  res.status(204).end();
});

export default router;
