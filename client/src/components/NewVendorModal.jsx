import { useState } from 'react'
import Toggle from './Toggle.jsx'

const initial = {
  company_name: '',
  acn_number: '',
  abn_number: '',
  cro_number: '',
  company_address: '',
  company_email: '',
  sole_owner: '',
  weekly_reminder_enabled: false,
}

const emptyPerson = { full_name: '', address: '', phone: '', email: '' }

export default function NewVendorModal({ onCancel, onCreate }) {
  const [form, setForm] = useState(initial)
  const [people, setPeople] = useState([{ ...emptyPerson }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setPersonField = (index, key) => (e) => {
    setPeople((p) => p.map((person, i) => (i === index ? { ...person, [key]: e.target.value } : person)))
  }

  const addPersonRow = () => setPeople((p) => [...p, { ...emptyPerson }])
  const removePersonRow = (index) => setPeople((p) => p.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company_name.trim()) {
      setError('Company name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const nonEmptyPeople = people.filter((p) => p.full_name || p.address || p.phone || p.email)
      await onCreate({ ...form, people: nonEmptyPeople })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Vendor</h2>
        <p className="muted">Enter the company &amp; contact details to start the checklist.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label>Company name *</label>
              <input value={form.company_name} onChange={set('company_name')} name="company_name" />
            </div>
            <div className="field">
              <label>ACN number</label>
              <input value={form.acn_number} onChange={set('acn_number')} name="acn_number" />
            </div>
            <div className="field">
              <label>ABN number</label>
              <input value={form.abn_number} onChange={set('abn_number')} name="abn_number" />
            </div>
            <div className="field">
              <label>CRO number</label>
              <input value={form.cro_number} onChange={set('cro_number')} name="cro_number" />
            </div>
            <div className="field">
              <label>Company email</label>
              <input type="email" value={form.company_email} onChange={set('company_email')} name="company_email" />
            </div>
            <div className="field full">
              <label>Company address</label>
              <input value={form.company_address} onChange={set('company_address')} name="company_address" />
            </div>

            <div className="field">
              <label>Sole owner of the company?</label>
              <select value={form.sole_owner} onChange={set('sole_owner')} name="sole_owner">
                <option value="">-</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="people-section">
            <div className="people-section-head">
              <label>People on this deal</label>
              <button type="button" className="btn secondary small" onClick={addPersonRow}>+ Add person</button>
            </div>

            {people.map((person, index) => (
              <div className="person-row" key={index}>
                <div className="form-grid">
                  <div className="field">
                    <label>Full name</label>
                    <input value={person.full_name} onChange={setPersonField(index, 'full_name')} />
                  </div>
                  <div className="field">
                    <label>Phone number</label>
                    <input value={person.phone} onChange={setPersonField(index, 'phone')} />
                  </div>
                  <div className="field full">
                    <label>Address</label>
                    <input value={person.address} onChange={setPersonField(index, 'address')} />
                  </div>
                  <div className="field full">
                    <label>Email address</label>
                    <input type="email" value={person.email} onChange={setPersonField(index, 'email')} />
                  </div>
                </div>
                {people.length > 1 && (
                  <button type="button" className="icon-btn danger remove-person" title="Remove person" onClick={() => removePersonRow(index)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="reminder-row">
            <Toggle
              checked={form.weekly_reminder_enabled}
              onChange={(val) => setForm((f) => ({ ...f, weekly_reminder_enabled: val }))}
              label="Send weekly email reminders for this vendor"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Creating…' : 'Create vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
