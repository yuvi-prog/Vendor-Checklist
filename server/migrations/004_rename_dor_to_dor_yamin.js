export function migrate(db) {
  db.exec("UPDATE checklist_items SET assignee = 'Dor/Yamin' WHERE assignee = 'Dor'");
}
