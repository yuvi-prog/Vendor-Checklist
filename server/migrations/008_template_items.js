// The checklist template used to be a hardcoded array (see git history of
// checklistTemplate.js) applied once at vendor creation. This migration turns
// it into a real table so edits made via the checklist's pencil/edit mode can
// be mirrored forward into what future vendors get seeded with, without
// touching any existing vendor's own checklist.
const ORIGINAL_TEMPLATE = [
  {
    assignee: 'Lina',
    tasks: [
      'Welcome email payment',
      'First invoice',
      'Setup B2B unleashed',
      'Stock Invoice',
    ],
  },
  {
    assignee: 'Yuvi',
    tasks: [
      'WhatsApp groups opening',
      {
        task: 'Welcome operational email with:',
        children: [
          'Vista Print (Order/not) Video',
          'Training B2B Video',
          'Square terminal order Video',
          'Photoshop account (Follow up) Video',
        ],
      },
      'Vendor Loop email',
      'Follow up Display if need to be printed',
      'Display checking after setup (Update the display folder)',
      'Training schedule',
      'How to put the display (video)',
    ],
  },
  {
    assignee: 'Lauren',
    tasks: [
      'Square & Loopz setup',
      'Create shop email - share shops folder',
      'Franchise Agreement',
      'Location on the website',
    ],
  },
  {
    assignee: 'Dor/Yamin',
    tasks: [
      'First stock order with the vendor',
      'Kiosk setup if required',
      'Printer order',
      'Kiosk order',
      'Location Chart',
      'Shipping booking',
      'Spare Part list',
      'Shipping Spare parts',
      'Camera if needed',
      'Setup Printer (gave Jose the details)',
      'Laptop Order',
      'ETA of the order',
      'Update Printer Details',
    ],
  },
  {
    assignee: 'Jose',
    tasks: ['Laptop setup'],
  },
];

function addColumnIfMissing(db, table, columnDef) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (err) {
    if (!/duplicate column name/i.test(err.message)) throw err;
  }
}

export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS template_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignee TEXT NOT NULL,
      task_name TEXT NOT NULL,
      parent_id INTEGER REFERENCES template_items(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  addColumnIfMissing(db, 'checklist_items', 'template_item_id INTEGER REFERENCES template_items(id) ON DELETE SET NULL');

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM template_items').get();
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO template_items (assignee, task_name, parent_id, sort_order)
      VALUES (?, ?, ?, ?)
    `);

    let order = 0;
    for (const group of ORIGINAL_TEMPLATE) {
      for (const entry of group.tasks) {
        order += 1;
        if (typeof entry === 'string') {
          insert.run(group.assignee, entry, null, order);
        } else {
          const result = insert.run(group.assignee, entry.task, null, order);
          const parentId = Number(result.lastInsertRowid);
          entry.children.forEach((childTask, idx) => {
            insert.run(group.assignee, childTask, parentId, idx + 1);
          });
        }
      }
    }
  }

  // Best-effort backfill: link existing (pre-feature) checklist_items to their
  // matching template_items row by (assignee, task_name), so edits on vendors
  // created before this feature also mirror forward. Safe to re-run — only
  // touches rows that are still unlinked.
  const topTemplates = db.prepare('SELECT * FROM template_items WHERE parent_id IS NULL').all();
  const childTemplates = db.prepare('SELECT * FROM template_items WHERE parent_id IS NOT NULL').all();
  const linkStmt = db.prepare('UPDATE checklist_items SET template_item_id = ? WHERE id = ?');

  const topItems = db.prepare(
    'SELECT * FROM checklist_items WHERE parent_id IS NULL AND template_item_id IS NULL'
  ).all();
  const matchedParents = new Map();
  for (const item of topItems) {
    const match = topTemplates.find((t) => t.assignee === item.assignee && t.task_name === item.task_name);
    if (match) {
      linkStmt.run(match.id, item.id);
      matchedParents.set(item.id, match.id);
    }
  }

  const childItems = db.prepare(
    'SELECT * FROM checklist_items WHERE parent_id IS NOT NULL AND template_item_id IS NULL'
  ).all();
  for (const item of childItems) {
    const parentTemplateId = matchedParents.get(item.parent_id);
    if (!parentTemplateId) continue;
    const match = childTemplates.find(
      (t) => t.parent_id === parentTemplateId && t.assignee === item.assignee && t.task_name === item.task_name
    );
    if (match) linkStmt.run(match.id, item.id);
  }
}
