import { Router } from 'express';
import { db } from '../db.js';
import { seedChecklistForVendor } from '../checklistTemplate.js';
import { sendKickoffEmail, sendWeeklyReminder } from '../email.js';

const router = Router();

const COMPANY_FIELDS = [
  'company_name', 'acn_number', 'abn_number', 'company_address', 'company_email', 'sole_owner',
];

const DEAL_FIELDS = [
  'location', 'date_opening', 'things_to_do', 'total_deal', 'deposit', 'payment_plan',
  'franchise_model', 'contract_shopping_center', 'display_included', 'training_included',
  'online_shop_included', 'online_shop_details', 'stock_price', 'retail_price',
  'wifi_included', 'laptop_included', 'setup_included', 'kiosk_size', 'kiosk_type',
  'stationary_included',
];

// GET /api/vendors — list with progress summary
router.get('/', (req, res) => {
  const vendors = db.prepare(`
    SELECT v.*, d.date_opening
    FROM vendors v
    LEFT JOIN deals d ON d.vendor_id = v.id
    ORDER BY v.created_at DESC
  `).all();
  const progressStmt = db.prepare(`
    SELECT COUNT(*) AS total, SUM(done) AS done
    FROM checklist_items WHERE vendor_id = ?
  `);
  const primaryContactStmt = db.prepare(`
    SELECT full_name FROM vendor_people WHERE vendor_id = ? ORDER BY sort_order LIMIT 1
  `);
  const result = vendors.map((v) => {
    const progress = progressStmt.get(v.id);
    const primaryContact = primaryContactStmt.get(v.id);
    return {
      ...v,
      total_items: progress.total,
      done_items: progress.done || 0,
      primary_contact_name: primaryContact?.full_name || null,
    };
  });
  res.json(result);
});

// POST /api/vendors — create vendor + seed checklist
router.post('/', async (req, res) => {
  const body = req.body || {};
  if (!body.company_name || !body.company_name.trim()) {
    return res.status(400).json({ error: 'company_name is required' });
  }

  const cols = COMPANY_FIELDS.filter((f) => body[f] !== undefined);
  if (body.weekly_reminder_enabled !== undefined) cols.push('weekly_reminder_enabled');
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map((f) =>
    f === 'weekly_reminder_enabled' ? (body.weekly_reminder_enabled ? 1 : 0) : body[f]
  );

  const insert = db.prepare(
    `INSERT INTO vendors (${cols.join(', ')}) VALUES (${placeholders})`
  );
  const result = insert.run(...values);
  const vendorId = Number(result.lastInsertRowid);

  db.prepare('INSERT INTO deals (vendor_id) VALUES (?)').run(vendorId);
  seedChecklistForVendor(db, vendorId);

  if (Array.isArray(body.people)) {
    const insertPerson = db.prepare(`
      INSERT INTO vendor_people (vendor_id, full_name, address, phone, email, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    body.people.forEach((p, idx) => {
      if (!p || (!p.full_name && !p.address && !p.phone && !p.email)) return;
      insertPerson.run(vendorId, p.full_name || null, p.address || null, p.phone || null, p.email || null, idx);
    });
  }

  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(vendorId);
  res.status(201).json(vendor);

  try {
    const deal = db.prepare('SELECT * FROM deals WHERE vendor_id = ?').get(vendorId);
    const people = db.prepare('SELECT * FROM vendor_people WHERE vendor_id = ? ORDER BY sort_order').all(vendorId);
    const result = await sendKickoffEmail(vendor, deal, people);
    if (!result?.skipped) {
      db.prepare("UPDATE vendors SET kickoff_email_sent_at = datetime('now') WHERE id = ?").run(vendorId);
    }
  } catch (err) {
    console.error('[email] Failed to send kickoff email:', err.message);
  }
});

// GET /api/vendors/:id — full detail
router.get('/:id', (req, res) => {
  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const deal = db.prepare('SELECT * FROM deals WHERE vendor_id = ?').get(req.params.id);
  const items = db.prepare(
    'SELECT * FROM checklist_items WHERE vendor_id = ? ORDER BY assignee, sort_order'
  ).all(req.params.id);
  const people = db.prepare(
    'SELECT * FROM vendor_people WHERE vendor_id = ? ORDER BY sort_order'
  ).all(req.params.id);

  res.json({ vendor, deal, items, people });
});

// POST /api/vendors/:id/people — add a person to an existing vendor
router.post('/:id/people', (req, res) => {
  const vendor = db.prepare('SELECT id FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const body = req.body || {};
  const maxOrder = db.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM vendor_people WHERE vendor_id = ?'
  ).get(req.params.id);

  const result = db.prepare(`
    INSERT INTO vendor_people (vendor_id, full_name, address, phone, email, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, body.full_name || null, body.address || null, body.phone || null, body.email || null, maxOrder.maxOrder + 1);

  res.status(201).json(db.prepare('SELECT * FROM vendor_people WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/vendors/:id/company
router.put('/:id/company', (req, res) => {
  const vendor = db.prepare('SELECT id FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const body = req.body || {};
  const cols = COMPANY_FIELDS.filter((f) => body[f] !== undefined);
  if (cols.length === 0) return res.json({ ok: true });

  const setClause = cols.map((f) => `${f} = ?`).join(', ');
  const values = cols.map((f) => body[f]);
  db.prepare(
    `UPDATE vendors SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
  ).run(...values, req.params.id);

  res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id));
});

// PUT /api/vendors/:id/deal
router.put('/:id/deal', (req, res) => {
  const vendor = db.prepare('SELECT id FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const body = req.body || {};
  const cols = DEAL_FIELDS.filter((f) => body[f] !== undefined);
  if (cols.length === 0) return res.json({ ok: true });

  const setClause = cols.map((f) => `${f} = ?`).join(', ');
  const values = cols.map((f) => body[f]);
  db.prepare(
    `UPDATE deals SET ${setClause}, updated_at = datetime('now') WHERE vendor_id = ?`
  ).run(...values, req.params.id);

  res.json(db.prepare('SELECT * FROM deals WHERE vendor_id = ?').get(req.params.id));
});

// PATCH /api/vendors/:id/reminder
router.patch('/:id/reminder', (req, res) => {
  const vendor = db.prepare('SELECT id FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const enabled = req.body?.enabled ? 1 : 0;
  db.prepare(
    "UPDATE vendors SET weekly_reminder_enabled = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(enabled, req.params.id);

  res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id));
});

// POST /api/vendors/:id/send-test-reminder — manually trigger the weekly
// reminder email for one vendor, sent only to the given address (not the
// office list), for testing without waiting for the Monday cron.
router.post('/:id/send-test-reminder', async (req, res) => {
  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const email = (req.body?.email || '').trim();
  if (!email) return res.status(400).json({ error: 'email is required' });

  const deal = db.prepare('SELECT * FROM deals WHERE vendor_id = ?').get(vendor.id);
  const items = db.prepare(
    'SELECT * FROM checklist_items WHERE vendor_id = ? ORDER BY assignee, sort_order'
  ).all(vendor.id);

  try {
    const result = await sendWeeklyReminder(vendor, deal, items, [email]);
    if (result?.skipped) {
      return res.status(503).json({ error: 'Email sending is not configured (missing SendGrid credentials)' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

const VALID_STATUSES = ['Onboarding', 'Live', 'On Hold'];

// PATCH /api/vendors/:id/archive
router.patch('/:id/archive', (req, res) => {
  const vendor = db.prepare('SELECT id FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const archived = req.body?.archived ? 1 : 0;
  db.prepare(
    "UPDATE vendors SET archived = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(archived, req.params.id);

  res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id));
});

// PATCH /api/vendors/:id/status
router.patch('/:id/status', (req, res) => {
  const vendor = db.prepare('SELECT id FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  if (!VALID_STATUSES.includes(req.body?.status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  db.prepare(
    "UPDATE vendors SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(req.body.status, req.params.id);

  res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id));
});

// DELETE /api/vendors/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Vendor not found' });
  res.status(204).end();
});

export default router;
