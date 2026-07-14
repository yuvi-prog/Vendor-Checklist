export function formatDateTime(sqliteStr) {
  if (!sqliteStr) return null
  const d = new Date(sqliteStr.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDateOnly(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
