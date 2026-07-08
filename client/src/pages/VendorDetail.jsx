import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import CompanyInfoForm from '../components/CompanyInfoForm.jsx'
import DealInfoForm from '../components/DealInfoForm.jsx'
import ChecklistSection from '../components/ChecklistSection.jsx'
import Toggle from '../components/Toggle.jsx'

const TABS = ['Checklist', 'Company Info', 'Deal Terms']

export default function VendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('Checklist')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getVendor(id).then(setData).finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm(`Delete ${data.vendor.company_name}? This cannot be undone.`)) return
    await api.deleteVendor(id)
    navigate('/')
  }

  const handleToggleReminder = async (enabled) => {
    setData((d) => ({ ...d, vendor: { ...d.vendor, weekly_reminder_enabled: enabled ? 1 : 0 } }))
    await api.updateReminder(id, enabled)
  }

  if (loading) return <p className="muted">Loading…</p>
  if (!data) return <p className="muted">Vendor not found.</p>

  const { vendor, deal, items } = data

  return (
    <div>
      <Link to="/" className="back-link">&larr; All vendors</Link>
      <div className="topbar">
        <h1>{vendor.company_name}</h1>
        <div className="topbar-actions">
          <Toggle
            checked={vendor.weekly_reminder_enabled}
            onChange={handleToggleReminder}
            label="Weekly email reminders"
          />
          <button className="btn danger" onClick={handleDelete}>Delete vendor</button>
        </div>
      </div>

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
          onSaved={(updated) => setData((d) => ({ ...d, vendor: updated }))}
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
