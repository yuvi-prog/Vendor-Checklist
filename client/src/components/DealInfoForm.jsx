import { useState } from 'react'
import { api } from '../api.js'

const yesNo = (value, onChange) => (
  <select value={value || ''} onChange={onChange}>
    <option value="">-</option>
    <option value="Yes">Yes</option>
    <option value="No">No</option>
  </select>
)

export default function DealInfoForm({ vendorId, deal, onSaved }) {
  const [form, setForm] = useState(deal || {})
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg('')
    const updated = await api.updateDeal(vendorId, form)
    onSaved(updated)
    setSaving(false)
    setSavedMsg('Saved')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  return (
    <form onSubmit={handleSave} className="card">
      <h2>Deal Terms</h2>
      <div className="form-grid">
        <div className="field">
          <label>Location</label>
          <input value={form.location || ''} onChange={set('location')} name="location" />
        </div>
        <div className="field">
          <label>Date opening</label>
          <input type="date" value={form.date_opening || ''} onChange={set('date_opening')} name="date_opening" />
        </div>
        <div className="field full">
          <label>Things to do</label>
          <textarea value={form.things_to_do || ''} onChange={set('things_to_do')} name="things_to_do" />
        </div>

        <div className="field">
          <label>Total deal</label>
          <input value={form.total_deal || ''} onChange={set('total_deal')} name="total_deal" />
        </div>
        <div className="field">
          <label>Deposit</label>
          <input value={form.deposit || ''} onChange={set('deposit')} name="deposit" />
        </div>
        <div className="field full">
          <label>Detailed payment plan</label>
          <textarea value={form.payment_plan || ''} onChange={set('payment_plan')} name="payment_plan" />
        </div>

        <div className="field">
          <label>Franchise / Partner / Ali model</label>
          <input value={form.franchise_model || ''} onChange={set('franchise_model')} name="franchise_model" />
        </div>
        <div className="field">
          <label>Contract for shopping center (are we getting it for them?)</label>
          {yesNo(form.contract_shopping_center, set('contract_shopping_center'))}
        </div>

        <div className="field">
          <label>Display included?</label>
          {yesNo(form.display_included, set('display_included'))}
        </div>
        <div className="field">
          <label>Training included?</label>
          {yesNo(form.training_included, set('training_included'))}
        </div>

        <div className="field">
          <label>Online shop included in deal?</label>
          {yesNo(form.online_shop_included, set('online_shop_included'))}
        </div>
        <div className="field full">
          <label>Online shop details</label>
          <textarea value={form.online_shop_details || ''} onChange={set('online_shop_details')} name="online_shop_details" />
        </div>

        <div className="field">
          <label>Stock price</label>
          <input value={form.stock_price || ''} onChange={set('stock_price')} name="stock_price" />
        </div>
        <div className="field">
          <label>Retail price for the country</label>
          <input value={form.retail_price || ''} onChange={set('retail_price')} name="retail_price" />
        </div>

        <div className="field">
          <label>Wifi included?</label>
          {yesNo(form.wifi_included, set('wifi_included'))}
        </div>
        <div className="field">
          <label>Laptop included as part of the deal?</label>
          {yesNo(form.laptop_included, set('laptop_included'))}
        </div>

        <div className="field">
          <label>Setup included?</label>
          {yesNo(form.setup_included, set('setup_included'))}
        </div>
        <div className="field">
          <label>Stationary included?</label>
          {yesNo(form.stationary_included, set('stationary_included'))}
        </div>

        <div className="field">
          <label>Size of the kiosk</label>
          <input value={form.kiosk_size || ''} onChange={set('kiosk_size')} name="kiosk_size" />
        </div>
        <div className="field">
          <label>What kind of kiosk</label>
          <input value={form.kiosk_type || ''} onChange={set('kiosk_type')} name="kiosk_type" />
        </div>
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
