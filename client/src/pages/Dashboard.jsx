import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import NewVendorModal from '../components/NewVendorModal.jsx'
import Toggle from '../components/Toggle.jsx'

export default function Dashboard() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    setLoading(true)
    api.listVendors().then(setVendors).finally(() => setLoading(false))
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

  return (
    <div>
      <div className="topbar">
        <h1>Vendor Onboarding Checklists</h1>
        <button className="btn" onClick={() => setShowModal(true)}>+ New Vendor</button>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : vendors.length === 0 ? (
        <div className="card empty-state">
          <p>No vendors yet. Add the first one to start a checklist.</p>
        </div>
      ) : (
        <div className="vendor-list">
          {vendors.map((v) => {
            const pct = v.total_items ? Math.round((v.done_items / v.total_items) * 100) : 0
            return (
              <Link to={`/vendors/${v.id}`} key={v.id} className="vendor-card">
                <div className="vendor-card-top">
                  <h3>{v.company_name}</h3>
                  <span className="muted">{pct}% complete</span>
                </div>
                <p className="muted">{v.owner_full_name || 'No owner name on file'}</p>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="vendor-card-footer">
                  <Toggle
                    checked={v.weekly_reminder_enabled}
                    onChange={(enabled) => handleToggleReminder(v.id, enabled)}
                    label="Weekly email reminders"
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <NewVendorModal onCancel={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}
