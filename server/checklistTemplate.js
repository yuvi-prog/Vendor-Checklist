// Standard onboarding checklist, grouped by team member.
// Applied to every new vendor when it's created.
export const CHECKLIST_TEMPLATE = [
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
    assignee: 'Dor',
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
    tasks: [
      'Laptop setup',
    ],
  },
];

export function seedChecklistForVendor(db, vendorId) {
  const insertItem = db.prepare(`
    INSERT INTO checklist_items (vendor_id, assignee, task_name, parent_id, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  let order = 0;
  for (const group of CHECKLIST_TEMPLATE) {
    for (const entry of group.tasks) {
      order += 1;
      if (typeof entry === 'string') {
        insertItem.run(vendorId, group.assignee, entry, null, order);
      } else {
        const result = insertItem.run(vendorId, group.assignee, entry.task, null, order);
        const parentId = Number(result.lastInsertRowid);
        entry.children.forEach((childTask, idx) => {
          insertItem.run(vendorId, group.assignee, childTask, parentId, idx + 1);
        });
      }
    }
  }
}
