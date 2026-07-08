import { useState } from 'react'
import { api } from '../api.js'

const PREFERRED_ORDER = ['Lina', 'Yuvi', 'Lauren', 'Dor', 'Jose']

function orderedAssignees(items) {
  const present = [...new Set(items.filter((i) => !i.parent_id).map((i) => i.assignee))]
  const known = PREFERRED_ORDER.filter((a) => present.includes(a))
  const extra = present.filter((a) => !PREFERRED_ORDER.includes(a)).sort()
  return [...known, ...extra]
}

function ChecklistRow({ item, isChild, editMode, assignees, onToggle, onNameChange, onAssigneeChange, onDelete }) {
  return (
    <div className={`checklist-item ${isChild ? 'child' : ''} ${item.done ? 'done' : ''}`}>
      <input
        type="checkbox"
        checked={!!item.done}
        onChange={(e) => onToggle(item.id, e.target.checked)}
      />
      {editMode ? (
        <input
          type="text"
          className="task-name-edit"
          value={item.task_name}
          onChange={(e) => onNameChange(item.id, e.target.value)}
          onBlur={(e) => onNameChange(item.id, e.target.value, true)}
        />
      ) : (
        <span className="task-name">{item.task_name}</span>
      )}
      {editMode && (
        <>
          <select
            className="assignee-select"
            value={item.assignee}
            onChange={(e) => onAssigneeChange(item.id, e.target.value)}
          >
            {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            type="button"
            className="icon-btn danger"
            title="Delete task"
            onClick={() => onDelete(item.id)}
          >
            ✕
          </button>
        </>
      )}
    </div>
  )
}

function AddTaskRow({ assignee, onAdd }) {
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(assignee, value.trim())
    setValue('')
  }

  return (
    <form className="add-task-row" onSubmit={submit}>
      <input
        type="text"
        placeholder={`Add a task for ${assignee}…`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="btn secondary">+ Add</button>
    </form>
  )
}

function AddPersonRow({ onAdd }) {
  const [name, setName] = useState('')
  const [task, setTask] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim() || !task.trim()) return
    onAdd(name.trim(), task.trim())
    setName('')
    setTask('')
  }

  return (
    <form className="add-person-row" onSubmit={submit}>
      <input
        type="text"
        placeholder="New person's name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Their first task"
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />
      <button type="submit" className="btn secondary">+ Add person</button>
    </form>
  )
}

export default function ChecklistSection({ vendorId, items, onItemsChange }) {
  const [editMode, setEditMode] = useState(false)

  const assignees = orderedAssignees(items)
  const grouped = assignees.map((assignee) => ({
    assignee,
    items: items.filter((i) => i.assignee === assignee && !i.parent_id),
  }))

  const childrenOf = (parentId) => items.filter((i) => i.parent_id === parentId)

  const applyLocalUpdate = (id, patch) => {
    onItemsChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  const handleToggle = async (id, done) => {
    applyLocalUpdate(id, { done })
    await api.updateChecklistItem(id, { done })
  }

  const handleNameChange = (id, value, commit) => {
    applyLocalUpdate(id, { task_name: value })
    if (!commit) return
    api.updateChecklistItem(id, { task_name: value })
  }

  const handleAssigneeChange = async (id, assignee) => {
    applyLocalUpdate(id, { assignee })
    await api.updateChecklistItem(id, { assignee })
  }

  const handleDelete = async (id) => {
    onItemsChange(items.filter((i) => i.id !== id && i.parent_id !== id))
    await api.deleteChecklistItem(id)
  }

  const handleAddTask = async (assignee, taskName) => {
    const created = await api.createChecklistItem({ vendor_id: vendorId, assignee, task_name: taskName })
    onItemsChange([...items, created])
  }

  const handleAddPerson = async (name, taskName) => {
    await handleAddTask(name, taskName)
  }

  const totalDone = items.filter((i) => i.done).length

  return (
    <div className="card">
      <div className="section-header">
        <h2>
          Checklist
          <button
            type="button"
            className={`icon-btn edit-toggle ${editMode ? 'active' : ''}`}
            title={editMode ? 'Done editing' : 'Edit checklist'}
            onClick={() => setEditMode((v) => !v)}
          >
            ✎
          </button>
        </h2>
        <span className="muted">{totalDone} / {items.length} complete</span>
      </div>

      {grouped.map((group) => (
        <div className="assignee-block" key={group.assignee}>
          <h3>{group.assignee}</h3>
          {group.items.map((item) => (
            <div key={item.id}>
              <ChecklistRow
                item={item}
                isChild={false}
                editMode={editMode}
                assignees={assignees}
                onToggle={handleToggle}
                onNameChange={handleNameChange}
                onAssigneeChange={handleAssigneeChange}
                onDelete={handleDelete}
              />
              {childrenOf(item.id).map((child) => (
                <ChecklistRow
                  key={child.id}
                  item={child}
                  isChild
                  editMode={editMode}
                  assignees={assignees}
                  onToggle={handleToggle}
                  onNameChange={handleNameChange}
                  onAssigneeChange={handleAssigneeChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}
          {editMode && <AddTaskRow assignee={group.assignee} onAdd={handleAddTask} />}
        </div>
      ))}

      {editMode && <AddPersonRow onAdd={handleAddPerson} />}
    </div>
  )
}
