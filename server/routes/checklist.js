import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// POST /api/checklist-items — add a new task
router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.vendor_id || !body.assignee || !body.assignee.trim() || !body.task_name || !body.task_name.trim()) {
    return res.status(400).json({ error: 'vendor_id, assignee, and task_name are required' });
  }

  const vendor = db.prepare('SELECT id FROM vendors WHERE id = ?').get(body.vendor_id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM checklist_items WHERE vendor_id = ? AND assignee = ?'
  ).get(body.vendor_id, body.assignee);

  const result = db.prepare(`
    INSERT INTO checklist_items (vendor_id, assignee, task_name, parent_id, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(body.vendor_id, body.assignee.trim(), body.task_name.trim(), body.parent_id || null, maxOrder.maxOrder + 1);

  res.status(201).json(db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(result.lastInsertRowid));
});

// PATCH /api/checklist-items/:id
router.patch('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Checklist item not found' });

  const body = req.body || {};
  const fields = [];
  const values = [];

  if (body.done !== undefined) {
    fields.push('done = ?');
    values.push(body.done ? 1 : 0);
  }
  if (body.required_by !== undefined) {
    fields.push('required_by = ?');
    values.push(body.required_by);
  }
  if (body.notes !== undefined) {
    fields.push('notes = ?');
    values.push(body.notes);
  }
  if (body.task_name !== undefined) {
    fields.push('task_name = ?');
    values.push(body.task_name);
  }
  if (body.assignee !== undefined) {
    fields.push('assignee = ?');
    values.push(body.assignee);
  }

  if (fields.length === 0) return res.json(item);

  fields.push("updated_at = datetime('now')");
  db.prepare(`UPDATE checklist_items SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values, req.params.id);

  res.json(db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id));
});

// DELETE /api/checklist-items/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM checklist_items WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Checklist item not found' });
  res.status(204).end();
});

export default router;
