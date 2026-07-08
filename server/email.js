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

export async function sendKickoffEmail(vendor) {
  const to = officeRecipients();
  if (to.length === 0) {
    console.warn('[email] OFFICE_RECIPIENTS not set — skipping kickoff email');
    return { skipped: true };
  }

  const link = `${appUrl()}/vendors/${vendor.id}`;
  const html = `
    <p>Hi team,</p>
    <p><strong>${vendor.company_name}</strong> has just been set up as a new vendor.</p>
    <p>This email is the loop for <strong>${vendor.company_name}</strong> — please use it (or the checklist link below) to keep everyone posted as you complete your onboarding tasks.</p>
    <p><a href="${link}">${link}</a></p>
    ${vendor.owner_full_name ? `<p>Owner: ${vendor.owner_full_name}</p>` : ''}
    <p>Please update us here once your tasks are done. Thanks!</p>
  `;

  return sendEmail({
    to,
    subject: `New Vendor Loop: ${vendor.company_name}`,
    html,
  });
}

export async function sendWeeklyReminder(vendor, items) {
  const to = officeRecipients();
  if (to.length === 0) return { skipped: true };

  const incomplete = items.filter((i) => !i.done);
  const done = items.length - incomplete.length;

  const byAssignee = {};
  for (const item of incomplete) {
    byAssignee[item.assignee] = byAssignee[item.assignee] || [];
    byAssignee[item.assignee].push(item);
  }

  const sections = Object.entries(byAssignee)
    .map(([assignee, tasks]) => `
      <h4>${assignee}</h4>
      <ul>
        ${tasks.map((t) => `<li>${t.task_name}${t.required_by ? ` (required by: ${t.required_by})` : ''}</li>`).join('')}
      </ul>
    `)
    .join('');

  const link = `${appUrl()}/vendors/${vendor.id}`;
  const html = `
    <p>Hi team,</p>
    <p>Weekly reminder for <strong>${vendor.company_name}</strong> — ${done}/${items.length} checklist items complete.</p>
    ${incomplete.length > 0 ? `<p>Still outstanding:</p>${sections}` : '<p>Everything is complete — nice work!</p>'}
    <p><a href="${link}">${link}</a></p>
  `;

  return sendEmail({
    to,
    subject: `Weekly reminder: ${vendor.company_name} (${done}/${items.length} complete)`,
    html,
  });
}
