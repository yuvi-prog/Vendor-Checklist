function addColumnIfMissing(db, table, columnDef) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (err) {
    if (!/duplicate column name/i.test(err.message)) throw err;
  }
}

export function migrate(db) {
  addColumnIfMissing(db, 'vendors', 'weekly_reminder_enabled INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'vendors', 'kickoff_email_sent_at TEXT');
  addColumnIfMissing(db, 'vendors', 'last_reminder_sent_at TEXT');
}
