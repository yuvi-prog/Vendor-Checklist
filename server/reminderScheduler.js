import cron from 'node-cron';
import { sendWeeklyReminder } from './email.js';

export function startReminderScheduler(db) {
  const schedule = process.env.REMINDER_CRON || '0 8 * * 1'; // 8am every Monday
  const timezone = process.env.REMINDER_TIMEZONE || 'Australia/Sydney';

  cron.schedule(schedule, () => runReminders(db), { timezone });
  console.log(`[reminders] Scheduled weekly reminders: "${schedule}" (${timezone})`);
}

export async function runReminders(db) {
  const vendors = db
    .prepare('SELECT * FROM vendors WHERE weekly_reminder_enabled = 1 AND archived = 0')
    .all();

  for (const vendor of vendors) {
    const deal = db.prepare('SELECT * FROM deals WHERE vendor_id = ?').get(vendor.id);
    const items = db
      .prepare('SELECT * FROM checklist_items WHERE vendor_id = ? ORDER BY assignee, sort_order')
      .all(vendor.id);

    try {
      const result = await sendWeeklyReminder(vendor, deal, items);
      if (!result?.skipped) {
        db.prepare("UPDATE vendors SET last_reminder_sent_at = datetime('now') WHERE id = ?").run(vendor.id);
      }
    } catch (err) {
      console.error(`[reminders] Failed to send reminder for vendor ${vendor.id}:`, err.message);
    }
  }
}
