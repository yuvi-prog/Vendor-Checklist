import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function GenerateDocumentModal({ vendor, templates, onClose }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id || '')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!templateId) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/vendors/${vendor.id}/generate-document?template_id=${templateId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Failed to generate document (${res.status})`)
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match ? match[1] : `${vendor.company_name}-franchise-agreement.docx`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create Franchise Document</h2>
        <p className="muted">Generate a filled franchise agreement for <strong>{vendor.company_name}</strong>.</p>

        {templates.length === 0 ? (
          <p className="muted">No templates uploaded yet. <Link to="/templates">Manage templates</Link>.</p>
        ) : (
          <div className="field">
            <label>Template</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.country} — {t.original_filename}</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn" onClick={handleGenerate} disabled={generating || templates.length === 0}>
            {generating ? 'Generating…' : 'Generate & Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
