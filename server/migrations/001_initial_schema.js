export function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      acn_number TEXT,
      company_address TEXT,
      company_email TEXT,
      owner_full_name TEXT,
      owner_address TEXT,
      owner_contact_number TEXT,
      owner_email TEXT,
      sole_owner TEXT,
      partner_name TEXT,
      partner_address TEXT,
      partner_phone TEXT,
      partner_email TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deals (
      vendor_id INTEGER PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
      location TEXT,
      date_opening TEXT,
      things_to_do TEXT,
      total_deal TEXT,
      deposit TEXT,
      payment_plan TEXT,
      franchise_model TEXT,
      contract_shopping_center TEXT,
      display_included TEXT,
      training_included TEXT,
      online_shop_included TEXT,
      online_shop_details TEXT,
      stock_price TEXT,
      retail_price TEXT,
      wifi_included TEXT,
      laptop_included TEXT,
      setup_included TEXT,
      kiosk_size TEXT,
      kiosk_type TEXT,
      stationary_included TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      assignee TEXT NOT NULL,
      task_name TEXT NOT NULL,
      parent_id INTEGER REFERENCES checklist_items(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      done INTEGER NOT NULL DEFAULT 0,
      required_by TEXT,
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_checklist_vendor ON checklist_items(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_checklist_parent ON checklist_items(parent_id);
  `);
}
