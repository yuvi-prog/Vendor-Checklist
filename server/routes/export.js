import { Router } from 'express';
import * as XLSX from 'xlsx';
import { db } from '../db.js';

const router = Router();

function sanitizeSheetName(name, used) {
  let clean = (name || 'Vendor').replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || 'Vendor';
  let candidate = clean;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n})`;
    candidate = clean.slice(0, 31 - suffix.length) + suffix;
    n += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function buildVendorSheet(vendor, deal, items) {
  const rows = [
    ['Company Name', vendor.company_name || ''],
    ['ACN Number', vendor.acn_number || ''],
    ['Company Address', vendor.company_address || ''],
    ['Company Email', vendor.company_email || ''],
    ['Owner Full Name', vendor.owner_full_name || ''],
    ['Owner Address', vendor.owner_address || ''],
    ['Best Contact Number', vendor.owner_contact_number || ''],
    ['Owner Email', vendor.owner_email || ''],
    ['Are You The Sole Owner Of The Company?', vendor.sole_owner || ''],
    ['Business Partner Name', vendor.partner_name || ''],
    ['Partner Address', vendor.partner_address || ''],
    ['Partner Phone Number', vendor.partner_phone || ''],
    ['Partner Email Address', vendor.partner_email || ''],
    [],
    ['DEAL TERMS'],
    ['Location', deal?.location || ''],
    ['Date Opening', deal?.date_opening || ''],
    ['Things To Do', deal?.things_to_do || ''],
    ['Total Deal', deal?.total_deal || ''],
    ['Deposit', deal?.deposit || ''],
    ['Detailed Payment Plan', deal?.payment_plan || ''],
    ['Franchise / Partner / Ali Model', deal?.franchise_model || ''],
    ['Contract For Shopping Center (Are We Getting It For Them?)', deal?.contract_shopping_center || ''],
    ['Display Included', deal?.display_included || ''],
    ['Training Included', deal?.training_included || ''],
    ['Online Shop Included In Deal', deal?.online_shop_included || ''],
    ['Online Shop Details', deal?.online_shop_details || ''],
    ['What Is The Stock Price', deal?.stock_price || ''],
    ['Retail Price For The Country', deal?.retail_price || ''],
    ['Wifi Included', deal?.wifi_included || ''],
    ['Laptop Included As Part Of The Deal', deal?.laptop_included || ''],
    ['Setup Included', deal?.setup_included || ''],
    ['Size Of The Kiosk', deal?.kiosk_size || ''],
    ['What Kind Of Kiosk', deal?.kiosk_type || ''],
    ['Stationary Included', deal?.stationary_included || ''],
    [],
    ['CHECKLIST'],
    ['Assignee', 'Task', 'Done'],
  ];

  const merges = [];
  const topLevel = items.filter((i) => !i.parent_id);
  const childrenOf = (id) => items.filter((i) => i.parent_id === id);

  let currentAssignee = null;
  let assigneeStartRow = null;

  const closeAssigneeMerge = (endRow) => {
    if (assigneeStartRow !== null && endRow > assigneeStartRow) {
      merges.push({ s: { r: assigneeStartRow, c: 0 }, e: { r: endRow, c: 0 } });
    }
  };

  for (const item of topLevel) {
    if (item.assignee !== currentAssignee) {
      closeAssigneeMerge(rows.length - 1);
      currentAssignee = item.assignee;
      assigneeStartRow = rows.length;
    }
    rows.push([item.assignee, item.task_name, item.done ? 'TRUE' : 'FALSE']);
    for (const child of childrenOf(item.id)) {
      rows.push(['', `    - ${child.task_name}`, child.done ? 'TRUE' : 'FALSE']);
    }
  }
  closeAssigneeMerge(rows.length - 1);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 48 }, { wch: 10 }];
  ws['!merges'] = merges;
  return ws;
}

// GET /api/export/xlsx
router.get('/xlsx', (req, res) => {
  const vendors = db.prepare('SELECT * FROM vendors ORDER BY created_at ASC').all();
  const wb = XLSX.utils.book_new();
  const usedNames = new Set();

  for (const vendor of vendors) {
    const deal = db.prepare('SELECT * FROM deals WHERE vendor_id = ?').get(vendor.id);
    const items = db.prepare(
      'SELECT * FROM checklist_items WHERE vendor_id = ? ORDER BY assignee, sort_order'
    ).all(vendor.id);

    const sheetName = sanitizeSheetName(vendor.company_name, usedNames);
    const ws = buildVendorSheet(vendor, deal, items);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  if (vendors.length === 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['No vendors yet']]), 'Vendors');
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `vendor-checklist-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export default router;
