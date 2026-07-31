import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { formatDateTime } from '../utils.js'

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [placeholders, setPlaceholders] = useState([])
  const [loading, setLoading] = useState(true)
  const [country, setCountry] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([api.listTemplates(), api.listPlaceholders()])
      .then(([t, p]) => { setTemplates(t); setPlaceholders(p) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!country.trim() || !file) {
      setError('Country and a .docx file are both required')
      return
    }
    setUploading(true)
    setError('')
    try {
      await api.uploadTemplate(country.trim(), file)
      setCountry('')
      setFile(null)
      e.target.reset()
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return
    await api.deleteTemplate(id)
    setTemplates((ts) => ts.filter((t) => t.id !== id))
  }

  return (
    <div>
      <Link to="/" className="back-link">&larr; All vendors</Link>
      <div className="topbar">
        <h1>Franchise Agreement Templates</h1>
      </div>

      <form className="card" onSubmit={handleUpload}>
        <h2>Upload a template</h2>
        <p className="muted">Upload a .docx file with placeholder tags (see reference below). One template per country.</p>
        <div className="form-grid">
          <div className="field">
            <label>Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Australia" />
          </div>
          <div className="field">
            <label>Template file (.docx)</label>
            <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files[0] || null)} />
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="save-bar">
          <button type="submit" className="btn" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload template'}
          </button>
        </div>
      </form>

      <div className="card">
        <h2>Templates</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="muted">No templates uploaded yet.</p>
        ) : (
          <div className="template-list">
            {templates.map((t) => (
              <div className="template-row" key={t.id}>
                <div>
                  <strong>{t.country}</strong>
                  <span className="muted"> — {t.original_filename}</span>
                  <div className="muted small">Uploaded {formatDateTime(t.uploaded_at)}</div>
                </div>
                <button type="button" className="icon-btn danger" title="Delete template" onClick={() => handleDelete(t.id, t.original_filename)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Available placeholder tags</h2>
        <p className="muted">
          Use these tags anywhere in your Word template, wrapped in curly braces — e.g. <code>{'{company_name}'}</code>.
          They'll be replaced with each vendor's actual data when a document is generated.
        </p>
        {placeholders.map((group) => (
          <div key={group.group} className="placeholder-group">
            <div className="placeholder-group-name">{group.group}</div>
            <div className="placeholder-tags">
              {group.tags.map((tag) => (
                <code key={tag} className="placeholder-tag">{`{${tag}}`}</code>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
