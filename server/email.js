import { wrapEmail, heading, paragraph, button, progressBar, assigneeGroup, successNote, dealMeta, peopleLine } from './emailTemplates.js';

const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send';

function officeRecipients() {
  return (process.env.OFFICE_RECIPIENTS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

function appUrl() {
  return (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn('[email] SENDGRID_API_KEY / SENDGRID_FROM_EMAIL not set — skipping send:', subject);
    return { skipped: true };
  }

  const res = await fetch(SENDGRID_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: to.map((email) => ({ email })) }],
      from: { email: fromEmail, name: process.env.SENDGRID_FROM_NAME || 'Memory Block Vendor Checklist' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SendGrid send failed (${res.status}): ${body}`);
  }

  return { skipped: false };
}

export async function sendKickoffEmail(vendor, deal, people) {
  const to = officeRecipients();
  if (to.length === 0) {
    console.warn('[email] OFFICE_RECIPIENTS not set — skipping kickoff email');
    return { skipped: true };
  }

  const link = `${appUrl()}/vendors/${vendor.id}`;
  const bodyHtml = [
    heading(`New Vendor: ${vendor.company_name}`),
    paragraph('Hi team,'),
    paragraph(
      `<strong>${vendor.company_name}</strong> has just been set up as a new vendor. This email is the loop for <strong>${vendor.company_name}</strong> — please use it, or the checklist link below, to keep everyone posted as you complete your onboarding tasks.`
    ),
    dealMeta(deal),
    peopleLine(people),
    button(link, 'Open Checklist'),
    paragraph('Please update us here once your tasks are done. Thanks!'),
  ].join('');

  return sendEmail({
    to,
    subject: `New Vendor Loop: ${vendor.company_name}`,
    html: wrapEmail({ preheader: `${vendor.company_name} has been added — check the onboarding checklist`, bodyHtml }),
  });
}

export async function sendWeeklyReminder(vendor, deal, items, overrideRecipients) {
  const to = overrideRecipients && overrideRecipients.length > 0 ? overrideRecipients : officeRecipients();
  if (to.length === 0) return { skipped: true };

  const incomplete = items.filter((i) => !i.done);
  const done = items.length - incomplete.length;

  const byAssignee = {};
  for (const item of incomplete) {
    byAssignee[item.assignee] = byAssignee[item.assignee] || [];
    byAssignee[item.assignee].push(item);
  }

  const sections = Object.entries(byAssignee)
    .map(([assignee, tasks]) => assigneeGroup(assignee, tasks))
    .join('');

  const link = `${appUrl()}/vendors/${vendor.id}`;
  const bodyHtml = [
    heading(`Weekly Reminder: ${vendor.company_name}`),
    dealMeta(deal),
    progressBar(done, items.length),
    incomplete.length > 0
      ? paragraph('Still outstanding:') + sections
      : successNote('Everything is complete — nice work!'),
    button(link, 'Open Checklist'),
  ].join('');

  return sendEmail({
    to,
    subject: `Weekly reminder: ${vendor.company_name} (${done}/${items.length} complete)`,
    html: wrapEmail({ preheader: `${done}/${items.length} complete for ${vendor.company_name}`, bodyHtml }),
  });
}
