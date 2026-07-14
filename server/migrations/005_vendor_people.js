export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendor_people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      full_name TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_vendor_people_vendor ON vendor_people(vendor_id);
  `);

  // Backfill: pull the old fixed owner/partner columns into vendor_people rows,
  // once per vendor (skip vendors that already have people rows, so this is
  // safe to run on every boot).
  const vendors = db.prepare(`
    SELECT id, owner_full_name, owner_address, owner_contact_number, owner_email,
           partner_name, partner_address, partner_phone, partner_email
    FROM vendors
  `).all();

  const hasPeople = db.prepare('SELECT 1 FROM vendor_people WHERE vendor_id = ? LIMIT 1');
  const insertPerson = db.prepare(`
    INSERT INTO vendor_people (vendor_id, full_name, address, phone, email, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const v of vendors) {
    if (hasPeople.get(v.id)) continue;

    let order = 0;
    if (v.owner_full_name || v.owner_address || v.owner_contact_number || v.owner_email) {
      insertPerson.run(v.id, v.owner_full_name, v.owner_address, v.owner_contact_number, v.owner_email, order);
      order += 1;
    }
    if (v.partner_name || v.partner_address || v.partner_phone || v.partner_email) {
      insertPerson.run(v.id, v.partner_name, v.partner_address, v.partner_phone, v.partner_email, order);
    }
  }
}
