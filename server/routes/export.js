import { Router } from 'express';
import * as XLSX from 'xlsx';
import { db } from '../db.js';

const router = Router();

const VENDOR_COLUMNS = [
  ['Company Name', 'company_name'],
  ['ACN Number', 'acn_number'],
  ['Company Address', 'company_address'],
  ['Company Email', 'company_email'],
  ['Owner Full Name', 'owner_full_name'],
  ['Owner Address', 'owner_address'],
  ['Owner Contact Number', 'owner_contact_number'],
  ['Owner Email', 'owner_email'],
  ['Sole Owner', 'sole_owner'],
  ['Partner Name', 'partner_name'],
  ['Partner Address', 'partner_address'],
  ['Partner Phone', 'partner_phone'],
  ['Partner Email', 'partner_email'],
  ['Location', 'location'],
  ['Date Opening', 'date_opening'],
  ['Things To Do', 'things_to_do'],
  ['Total Deal', 'total_deal'],
  ['Deposit', 'deposit'],
  ['Detailed Payment Plan', 'payment_plan'],
  ['Franchise / Partner / Ali Model', 'franchise_model'],
  ['Contract For Shopping Center', 'contract_shopping_center'],
  ['Display Included', 'display_included'],
  ['Training Included', 'training_included'],
  ['Online Shop Included', 'online_shop_included'],
  ['Online Shop Details', 'online_shop_details'],
  ['Stock Price', 'stock_price'],
  ['Retail Price', 'retail_price'],
  ['Wifi Included', 'wifi_included'],
  ['Laptop Included', 'laptop_included'],
  ['Setup Included', 'setup_included'],
  ['Kiosk Size', 'kiosk_size'],
  ['Kiosk Type', 'kiosk_type'],
  ['Stationary Included', 'stationary_included'],
  ['Weekly Reminders Enabled', 'weekly_reminder_enabled'],
  ['Checklist Progress', 'progress'],
  ['Created At', 'created_at'],
];

// GET /api/export/xlsx
router.get('/xlsx', (req, res) => {
  const vendors = db.prepare(`
    SELECT v.*, d.location, d.date_opening, d.things_to_do, d.total_deal, d.deposit,
           d.payment_plan, d.franchise_model, d.contract_shopping_center, d.display_included,
           d.training_included, d.online_shop_included, d.online_shop_details, d.stock_price,
           d.retail_price, d.wifi_included, d.laptop_included, d.setup_included, d.kiosk_size,
           d.kiosk_type, d.stationary_included
    FROM vendors v
    LEFT JOIN deals d ON d.vendor_id = v.id
    ORDER BY v.created_at DESC
  `).all();

  const items = db.prepare(`
    SELECT ci.*, v.company_name, parent.task_name AS parent_task_name
    FROM checklist_items ci
    JOIN vendors v ON v.id = ci.vendor_id
    LEFT JOIN checklist_items parent ON parent.id = ci.parent_id
    ORDER BY v.company_name, ci.assignee, ci.sort_order
  `).all();

  const vendorRows = vendors.map((v) => {
    const progressStmt = db.prepare(
      'SELECT COUNT(*) AS total, SUM(done) AS done FROM checklist_items WHERE vendor_id = ?'
    ).get(v.id);
    const row = {};
    for (const [label, key] of VENDOR_COLUMNS) {
      if (key === 'progress') {
        row[label] = `${progressStmt.done || 0} / ${progressStmt.total || 0}`;
      } else if (key === 'weekly_reminder_enabled') {
        row[label] = v[key] ? 'Yes' : 'No';
      } else {
        row[label] = v[key] ?? '';
      }
    }
    return row;
  });

  const checklistRows = items.map((i) => ({
    'Company': i.company_name,
    'Assignee': i.assignee,
    'Sub-task Of': i.parent_task_name || '',
    'Task': i.task_name,
    'Done': i.done ? 'Yes' : 'No',
    'Required By': i.required_by || '',
    'Notes': i.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendorRows), 'Vendors');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(checklistRows), 'Checklist');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `vendor-checklist-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export default router;
