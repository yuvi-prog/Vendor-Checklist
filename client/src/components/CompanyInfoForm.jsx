import { useState } from 'react'
import { api } from '../api.js'

function PersonRow({ person, onChange, onRemove }) {
  const set = (key) => (e) => onChange({ ...person, [key]: e.target.value })
  const commit = (key) => (e) => api.updatePerson(person.id, { [key]: e.target.value })

  return (
    <div className="person-row">
      <div className="form-grid">
        <div className="field">
          <label>Full name</label>
          <input value={person.full_name || ''} onChange={set('full_name')} onBlur={commit('full_name')} />
        </div>
        <div className="field">
          <label>Phone number</label>
          <input value={person.phone || ''} onChange={set('phone')} onBlur={commit('phone')} />
        </div>
        <div className="field full">
          <label>Address</label>
          <input value={person.address || ''} onChange={set('address')} onBlur={commit('address')} />
        </div>
        <div className="field full">
          <label>Email address</label>
          <input type="email" value={person.email || ''} onChange={set('email')} onBlur={commit('email')} />
        </div>
      </div>
      <button type="button" className="icon-btn danger remove-person" title="Remove person" onClick={onRemove}>
        ✕
      </button>
    </div>
  )
}

export default function CompanyInfoForm({ vendor, people, onSaved, onPeopleChange }) {
  const [form, setForm] = useState(vendor)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [addingPerson, setAddingPerson] = useState(false)

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

  const handleAddPerson = async () => {
    setAddingPerson(true)
    try {
      const created = await api.addPerson(vendor.id, {})
      onPeopleChange([...people, created])
    } finally {
      setAddingPerson(false)
    }
  }

  const handlePersonChange = (index, updated) => {
    onPeopleChange(people.map((p, i) => (i === index ? updated : p)))
  }

  const handleRemovePerson = async (index) => {
    const person = people[index]
    onPeopleChange(people.filter((_, i) => i !== index))
    await api.deletePerson(person.id)
  }

  return (
    <>
      <form onSubmit={handleSave} className="card">
        <h2>Company Info</h2>
        <div className="form-grid">
          <div className="field full">
            <label>Company name</label>
            <input value={form.company_name || ''} onChange={set('company_name')} name="company_name" />
          </div>
          <div className="field">
            <label>ACN/ABN</label>
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
            <label>Sole owner of the company?</label>
            <select value={form.sole_owner || ''} onChange={set('sole_owner')} name="sole_owner">
              <option value="">-</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        <div className="save-bar">
          {savedMsg && <span className="status-msg">{savedMsg}</span>}
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>

      <div className="card">
        <div className="people-section-head">
          <h2 style={{ marginBottom: 0 }}>People on this deal</h2>
          <button type="button" className="btn secondary small" onClick={handleAddPerson} disabled={addingPerson}>
            + Add person
          </button>
        </div>
        {people.length === 0 && <p className="muted">No people added yet.</p>}
        {people.map((person, index) => (
          <PersonRow
            key={person.id}
            person={person}
            onChange={(updated) => handlePersonChange(index, updated)}
            onRemove={() => handleRemovePerson(index)}
          />
        ))}
      </div>
    </>
  )
}
