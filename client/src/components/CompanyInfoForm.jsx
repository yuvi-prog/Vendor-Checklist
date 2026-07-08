import { useState } from 'react'
import { api } from '../api.js'

export default function CompanyInfoForm({ vendor, onSaved }) {
  const [form, setForm] = useState(vendor)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg('')
    const updated = await api.updateCompany(vendor.id, form)
    onSaved(updated)
    setSaving(false)
    setSavedMsg('Saved')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  return (
    <form onSubmit={handleSave} className="card">
      <h2>Company Info</h2>
      <div className="form-grid">
        <div className="field full">
          <label>Company name</label>
          <input value={form.company_name || ''} onChange={set('company_name')} name="company_name" />
        </div>
        <div className="field">
          <label>ACN number</label>
          <input value={form.acn_number || ''} onChange={set('acn_number')} name="acn_number" />
        </div>
        <div className="field">
          <label>Company email</label>
          <input type="email" value={form.company_email || ''} onChange={set('company_email')} name="company_email" />
        </div>
        <div className="field full">
          <label>Company address</label>
          <input value={form.company_address || ''} onChange={set('company_address')} name="company_address" />
        </div>

        <div className="field">
          <label>Owner full name</label>
          <input value={form.owner_full_name || ''} onChange={set('owner_full_name')} name="owner_full_name" />
        </div>
        <div className="field">
          <label>Owner contact number</label>
          <input value={form.owner_contact_number || ''} onChange={set('owner_contact_number')} name="owner_contact_number" />
        </div>
        <div className="field full">
          <label>Owner address</label>
          <input value={form.owner_address || ''} onChange={set('owner_address')} name="owner_address" />
        </div>
        <div className="field full">
          <label>Owner email</label>
          <input type="email" value={form.owner_email || ''} onChange={set('owner_email')} name="owner_email" />
        </div>

        <div className="field">
          <label>Sole owner of the company?</label>
          <select value={form.sole_owner || ''} onChange={set('sole_owner')} name="sole_owner">
            <option value="">-</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {form.sole_owner === 'No' && (
          <>
            <div className="field">
              <label>Business partner name</label>
              <input value={form.partner_name || ''} onChange={set('partner_name')} name="partner_name" />
            </div>
            <div className="field full">
              <label>Partner address</label>
              <input value={form.partner_address || ''} onChange={set('partner_address')} name="partner_address" />
            </div>
            <div className="field">
              <label>Partner phone</label>
              <input value={form.partner_phone || ''} onChange={set('partner_phone')} name="partner_phone" />
            </div>
            <div className="field">
              <label>Partner email</label>
              <input type="email" value={form.partner_email || ''} onChange={set('partner_email')} name="partner_email" />
            </div>
          </>
        )}
      </div>

      <div className="save-bar">
        {savedMsg && <span className="status-msg">{savedMsg}</span>}
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
