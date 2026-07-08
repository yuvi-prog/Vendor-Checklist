function addColumnIfMissing(db, table, columnDef) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (err) {
    if (!/duplicate column name/i.test(err.message)) throw err;
  }
}

export function migrate(db) {
  addColumnIfMissing(db, 'vendors', 'archived INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'vendors', "status TEXT NOT NULL DEFAULT 'Onboarding'");
}
