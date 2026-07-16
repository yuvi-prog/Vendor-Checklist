const COLORS = {
  peachLight: '#FFF0E8',
  peachMid: '#F5C9B3',
  peachWarm: '#E8A882',
  charcoal: '#2C2C2C',
  charcoalSoft: '#5C5C5C',
  white: '#FFFFFF',
  success: '#6DAF85',
  border: '#EDD9CC',
};

const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

export function wrapEmail({ preheader, bodyHtml }) {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0; padding:0; background-color:${COLORS.peachLight};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader || ''}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.peachLight};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${COLORS.white}; border-radius:12px; border:1px solid ${COLORS.border};">
            <tr>
              <td style="background-color:${COLORS.peachWarm}; padding:26px 32px; border-radius:12px 12px 0 0;">
                <div style="font-family:${SERIF}; font-size:22px; color:${COLORS.white}; font-weight:bold; letter-spacing:0.3px;">Memory Block</div>
                <div style="font-family:${SANS}; font-size:13px; color:${COLORS.peachLight}; margin-top:4px;">Vendor Onboarding</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px; background-color:${COLORS.peachLight}; border-top:1px solid ${COLORS.border}; border-radius:0 0 12px 12px;">
                <div style="font-family:${SANS}; font-size:12px; color:${COLORS.charcoalSoft};">
                  Sent automatically by the Memory Block Vendor Checklist.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function heading(text) {
  return `<h1 style="font-family:${SERIF}; font-size:21px; color:${COLORS.charcoal}; margin:0 0 16px; font-weight:normal;">${text}</h1>`;
}

export function paragraph(text) {
  return `<p style="font-family:${SANS}; font-size:14px; color:${COLORS.charcoal}; line-height:1.6; margin:0 0 14px;">${text}</p>`;
}

export function button(url, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 8px 0 22px;">
      <tr>
        <td style="border-radius:8px; background-color:${COLORS.peachWarm};">
          <a href="${url}" target="_blank" style="display:inline-block; padding:12px 26px; font-family:${SANS}; font-size:14px; font-weight:bold; color:${COLORS.white}; text-decoration:none; border-radius:8px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

export function progressBar(done, total) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 2px 0 6px;">
      <tr>
        <td style="background-color:${COLORS.border}; border-radius:999px; font-size:0; line-height:0;">
          <div style="background-color:${COLORS.success}; height:10px; width:${pct}%; border-radius:999px;">&nbsp;</div>
        </td>
      </tr>
    </table>
    <div style="font-family:${SANS}; font-size:12px; color:${COLORS.charcoalSoft}; margin:0 0 20px;">${done} / ${total} complete (${pct}%)</div>`;
}

export function assigneeGroup(assignee, tasks) {
  return `
    <div style="margin: 18px 0 6px;">
      <div style="font-family:${SERIF}; font-size:15px; color:${COLORS.charcoal}; border-bottom:2px solid ${COLORS.peachMid}; padding-bottom:6px; margin-bottom:8px;">${assignee}</div>
      <ul style="margin:0; padding-left:20px; font-family:${SANS}; font-size:14px; color:${COLORS.charcoal}; line-height:1.9;">
        ${tasks.map((t) => `<li>${t.task_name}</li>`).join('')}
      </ul>
    </div>`;
}

export function successNote(text) {
  return `<p style="font-family:${SANS}; font-size:14px; color:${COLORS.success}; font-weight:bold; margin:0 0 14px;">${text}</p>`;
}

function formatDateOnly(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function dealMeta(deal) {
  const location = deal?.location?.trim() || 'Not set yet';
  const opening = formatDateOnly(deal?.date_opening) || 'Not set yet';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
      <tr>
        <td style="font-family:${SANS}; font-size:13px; color:${COLORS.charcoalSoft}; padding-right:20px;">
          Location<br><strong style="font-size:14px; color:${COLORS.charcoal};">${location}</strong>
        </td>
        <td style="font-family:${SANS}; font-size:13px; color:${COLORS.charcoalSoft};">
          Opening date<br><strong style="font-size:14px; color:${COLORS.charcoal};">${opening}</strong>
        </td>
      </tr>
    </table>`;
}

export function peopleLine(people) {
  const names = (people || []).map((p) => p.full_name).filter(Boolean);
  if (names.length === 0) return '';
  return paragraph(`Contact${names.length > 1 ? 's' : ''}: <strong>${names.join(', ')}</strong>`);
}
