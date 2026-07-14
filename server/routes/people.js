import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const PERSON_FIELDS = ['full_name', 'address', 'phone', 'email'];

// PATCH /api/people/:id
router.patch('/:id', (req, res) => {
  const person = db.prepare('SELECT * FROM vendor_people WHERE id = ?').get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const body = req.body || {};
  const cols = PERSON_FIELDS.filter((f) => body[f] !== undefined);
  if (cols.length === 0) return res.json(person);

  const setClause = cols.map((f) => `${f} = ?`).join(', ');
  const values = cols.map((f) => body[f]);
  db.prepare(`UPDATE vendor_people SET ${setClause} WHERE id = ?`).run(...values, req.params.id);

  res.json(db.prepare('SELECT * FROM vendor_people WHERE id = ?').get(req.params.id));
});

// DELETE /api/people/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM vendor_people WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Person not found' });
  res.status(204).end();
});

export default router;
