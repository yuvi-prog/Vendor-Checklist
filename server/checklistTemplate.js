// Seeds a new vendor's checklist from the live template_items table (see
// migrations/008_template_items.js). Each created checklist_item records
// which template_items row it came from (template_item_id), so later edits
// made via the checklist's pencil/edit mode can mirror back into the master
// template for future vendors — see routes/checklist.js.
export function seedChecklistForVendor(db, vendorId) {
  const allTemplateItems = db.prepare('SELECT * FROM template_items ORDER BY sort_order').all();
  const topLevel = allTemplateItems.filter((t) => !t.parent_id);
  const childrenOf = (id) => allTemplateItems.filter((t) => t.parent_id === id);

  const insertItem = db.prepare(`
    INSERT INTO checklist_items (vendor_id, assignee, task_name, parent_id, sort_order, template_item_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const item of topLevel) {
    const result = insertItem.run(vendorId, item.assignee, item.task_name, null, item.sort_order, item.id);
    const newParentId = Number(result.lastInsertRowid);
    for (const child of childrenOf(item.id)) {
      insertItem.run(vendorId, child.assignee, child.task_name, newParentId, child.sort_order, child.id);
    }
  }
}
