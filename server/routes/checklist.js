import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// POST /api/checklist-items — add a new task. Also adds it to the master
// template (template_items) so every vendor created from now on gets it too.
router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.vendor_id || !body.assignee || !body.assignee.trim() || !body.task_name || !body.task_name.trim()) {
    return res.status(400).json({ error: 'vendor_id, assignee, and task_name are required' });
  }

  const vendor = db.prepare('SELECT id FROM vendors WHERE id = ?').get(body.vendor_id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const assignee = body.assignee.trim();
  const taskName = body.task_name.trim();

  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM checklist_items WHERE vendor_id = ? AND assignee = ?'
  ).get(body.vendor_id, assignee);

  const maxTemplateOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM template_items WHERE assignee = ?'
  ).get(assignee);
  const templateResult = db.prepare(`
    INSERT INTO template_items (assignee, task_name, parent_id, sort_order)
    VALUES (?, ?, NULL, ?)
  `).run(assignee, taskName, maxTemplateOrder.maxOrder + 1);

  const result = db.prepare(`
    INSERT INTO checklist_items (vendor_id, assignee, task_name, parent_id, sort_order, template_item_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(body.vendor_id, assignee, taskName, body.parent_id || null, maxOrder.maxOrder + 1, templateResult.lastInsertRowid);

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

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    db.prepare(`UPDATE checklist_items SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values, req.params.id);
  }

  // Mirror structural edits (rename / reassign) into the master template so
  // future vendors pick them up. done/notes are this vendor's own state and
  // never mirror.
  if (item.template_item_id && (body.task_name !== undefined || body.assignee !== undefined)) {
    const tFields = [];
    const tValues = [];
    if (body.task_name !== undefined) { tFields.push('task_name = ?'); tValues.push(body.task_name); }
    if (body.assignee !== undefined) { tFields.push('assignee = ?'); tValues.push(body.assignee); }
    db.prepare(`UPDATE template_items SET ${tFields.join(', ')} WHERE id = ?`).run(...tValues, item.template_item_id);
  }

  res.json(db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id));
});

// DELETE /api/checklist-items/:id — also removes it from the master template
// (other vendors' own checklists are untouched; they just lose the link back
// to the now-deleted template row).
router.delete('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Checklist item not found' });

  if (item.template_item_id) {
    db.prepare('DELETE FROM template_items WHERE id = ?').run(item.template_item_id);
  }
  db.prepare('DELETE FROM checklist_items WHERE id = ?').run(req.params.id);

  res.status(204).end();
});

export default router;
