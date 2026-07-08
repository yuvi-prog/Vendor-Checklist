export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track"><span className="toggle-thumb" /></span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  )
}
