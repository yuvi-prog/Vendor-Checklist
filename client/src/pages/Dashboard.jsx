import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import NewVendorModal from '../components/NewVendorModal.jsx'
import GenerateDocumentModal from '../components/GenerateDocumentModal.jsx'
import Toggle from '../components/Toggle.jsx'
import { STATUSES, STATUS_CLASS } from '../constants.js'
import { formatDateOnly } from '../utils.js'

const STATUS_FILTERS = ['All', ...STATUSES]

export default function Dashboard() {
  const [vendors, setVendors] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [genDocVendor, setGenDocVendor] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showArchived, setShowArchived] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.listVendors(), api.listTemplates()])
      .then(([v, t]) => { setVendors(v); setTemplates(t) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (form) => {
    const vendor = await api.createVendor(form)
    setShowModal(false)
    load()
    window.location.href = `/vendors/${vendor.id}`
  }

  const handleToggleReminder = async (id, enabled) => {
    setVendors((vs) => vs.map((v) => (v.id === id ? { ...v, weekly_reminder_enabled: enabled ? 1 : 0 } : v)))
    await api.updateReminder(id, enabled)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vendors.filter((v) => {
      if (!showArchived && v.archived) return false
      if (showArchived && !v.archived) return false
      if (statusFilter !== 'All' && v.status !== statusFilter) return false
      if (q && !`${v.company_name} ${v.primary_contact_name || ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [vendors, search, statusFilter, showArchived])

  return (
    <div>
      <div className="topbar">
        <h1>Vendor Onboarding Checklists</h1>
        <div className="topbar-actions">
          <Link to="/templates" className="btn secondary">Manage Templates</Link>
          <a href="/api/export/xlsx" className="btn secondary">Export to Excel</a>
          <button className="btn" onClick={() => setShowModal(true)}>+ New Vendor</button>
        </div>
      </div>

      <div className="dashboard-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search by company or owner name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="status-chips">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="archived-toggle">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <p>{vendors.length === 0 ? 'No vendors yet. Add the first one to start a checklist.' : 'No vendors match your filters.'}</p>
        </div>
      ) : (
        <div className="vendor-list">
          {filtered.map((v) => {
            const pct = v.total_items ? Math.round((v.done_items / v.total_items) * 100) : 0
            return (
              <Link to={`/vendors/${v.id}`} key={v.id} className={`vendor-card ${v.archived ? 'archived' : ''}`}>
                <div className="vendor-card-top">
                  <h3>{v.company_name}</h3>
                  <div className="vendor-card-tags">
                    <span className={`status-badge ${STATUS_CLASS[v.status] || ''}`}>{v.status || 'Onboarding'}</span>
                    {v.archived ? <span className="status-badge status-archived">Archived</span> : null}
                    <span className="muted">{pct}% complete</span>
                  </div>
                </div>
                <div className="vendor-card-meta">
                  <p className="muted">{v.primary_contact_name || 'No contact on file'}</p>
                  <p className="muted opening-date">{formatDateOnly(v.date_opening) ? `Opens ${formatDateOnly(v.date_opening)}` : 'Opening date not set'}</p>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="vendor-card-footer">
                  <Toggle
                    checked={v.weekly_reminder_enabled}
                    onChange={(enabled) => handleToggleReminder(v.id, enabled)}
                    label="Weekly email reminders"
                  />
                  <button
                    type="button"
                    className="btn secondary small"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setGenDocVendor(v) }}
                  >
                    Create Franchise Document
                  </button>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <NewVendorModal onCancel={() => setShowModal(false)} onCreate={handleCreate} />
      )}

      {genDocVendor && (
        <GenerateDocumentModal
          vendor={genDocVendor}
          templates={templates}
          onClose={() => setGenDocVendor(null)}
        />
      )}
    </div>
  )
}
