import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api.js'
import CompanyInfoForm from '../components/CompanyInfoForm.jsx'
import DealInfoForm from '../components/DealInfoForm.jsx'
import ChecklistSection from '../components/ChecklistSection.jsx'
import Toggle from '../components/Toggle.jsx'
import { STATUSES, STATUS_CLASS } from '../constants.js'
import { formatDateTime, formatDateOnly } from '../utils.js'

const TABS = ['Checklist', 'Company Info', 'Deal Terms']

export default function VendorDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('Checklist')
  const [loading, setLoading] = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [testStatus, setTestStatus] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  useEffect(() => {
    api.getVendor(id).then(setData).finally(() => setLoading(false))
  }, [id])

  const handleToggleReminder = async (enabled) => {
    setData((d) => ({ ...d, vendor: { ...d.vendor, weekly_reminder_enabled: enabled ? 1 : 0 } }))
    await api.updateReminder(id, enabled)
  }

  const handleToggleArchive = async () => {
    const archiving = !data.vendor.archived
    if (archiving && !confirm(`Archive ${data.vendor.company_name}? It'll be hidden from the main dashboard but you can restore it anytime.`)) return
    const updated = await api.updateArchived(id, archiving)
    setData((d) => ({ ...d, vendor: updated }))
  }

  const handleStatusChange = async (status) => {
    setData((d) => ({ ...d, vendor: { ...d.vendor, status } }))
    await api.updateStatus(id, status)
  }

  const handleSendTestReminder = async (e) => {
    e.preventDefault()
    if (!testEmail.trim()) return
    setSendingTest(true)
    setTestStatus('')
    try {
      await api.sendTestReminder(id, testEmail.trim())
      setTestStatus(`Sent to ${testEmail.trim()}`)
    } catch (err) {
      setTestStatus(`Failed: ${err.message}`)
    } finally {
      setSendingTest(false)
    }
  }

  if (loading) return <p className="muted">Loading…</p>
  if (!data) return <p className="muted">Vendor not found.</p>

  const { vendor, deal, items, people } = data
  const kickoffSent = formatDateTime(vendor.kickoff_email_sent_at)
  const lastReminder = formatDateTime(vendor.last_reminder_sent_at)
  const openingDate = formatDateOnly(deal?.date_opening)

  return (
    <div>
      <Link to="/" className="back-link">&larr; All vendors</Link>
      <div className="topbar">
        <h1>
          {vendor.company_name}{' '}
          <span className={`status-badge ${STATUS_CLASS[vendor.status] || ''}`}>{vendor.status || 'Onboarding'}</span>
          {vendor.archived ? <span className="status-badge status-archived">Archived</span> : null}
          <span className="opening-badge">{openingDate ? `Opens ${openingDate}` : 'Opening date not set'}</span>
        </h1>
        <div className="topbar-actions">
          <select
            className="status-select"
            value={vendor.status || 'Onboarding'}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Toggle
            checked={vendor.weekly_reminder_enabled}
            onChange={handleToggleReminder}
            label="Weekly email reminders"
          />
          <button className="btn danger" onClick={handleToggleArchive}>
            {vendor.archived ? 'Unarchive vendor' : 'Archive vendor'}
          </button>
        </div>
      </div>

      <p className="email-status-line muted">
        Kickoff email: {kickoffSent ? `sent ${kickoffSent}` : 'not sent yet'}
        {' · '}
        Last weekly reminder: {lastReminder ? lastReminder : 'none sent yet'}
      </p>

      <form className="test-reminder-row" onSubmit={handleSendTestReminder}>
        <input
          type="email"
          placeholder="your email address"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn secondary" disabled={sendingTest}>
          {sendingTest ? 'Sending…' : 'Send this week’s reminder to me'}
        </button>
        {testStatus && <span className="muted">{testStatus}</span>}
      </form>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Checklist' && (
        <ChecklistSection
          vendorId={id}
          items={items}
          onItemsChange={(newItems) => setData((d) => ({ ...d, items: newItems }))}
        />
      )}

      {tab === 'Company Info' && (
        <CompanyInfoForm
          vendor={vendor}
          people={people}
          onSaved={(updated) => setData((d) => ({ ...d, vendor: updated }))}
          onPeopleChange={(newPeople) => setData((d) => ({ ...d, people: newPeople }))}
        />
      )}

      {tab === 'Deal Terms' && (
        <DealInfoForm
          vendorId={id}
          deal={deal}
          onSaved={(updated) => setData((d) => ({ ...d, deal: updated }))}
        />
      )}
    </div>
  )
}
