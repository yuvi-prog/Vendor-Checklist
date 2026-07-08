import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { migrate as migrateInitial } from './migrations/001_initial_schema.js';
import { migrate as migrateReminders } from './migrations/002_add_reminders.js';
import vendorsRouter from './routes/vendors.js';
import checklistRouter from './routes/checklist.js';
import { startReminderScheduler } from './reminderScheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

migrateInitial(db);
migrateReminders(db);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/vendors', vendorsRouter);
app.use('/api/checklist-items', checklistRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve built client in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Vendor checklist API listening on :${PORT}`);
  startReminderScheduler(db);
});
