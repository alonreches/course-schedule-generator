import { useState, useEffect, useRef } from 'react'
import type { AppStore, NamedTemplate, TemplateItem } from './types'

// ── Shared inline-edit hook ───────────────────────────────────────────────────

function useInlineEdit() {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const startEditing = (index: number, current: string) => {
    setEditingIndex(index)
    setEditingName(current)
  }

  const cancelEditing = () => setEditingIndex(null)

  return { editingIndex, editingName, setEditingName, startEditing, cancelEditing }
}

// ── Root screen ───────────────────────────────────────────────────────────────

export default function TemplatesScreen() {
  const [store, setStore] = useState<AppStore>({ templates: [], instructors: [], simulators: [] })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refresh = async () => {
    const data = await window.api.getAll()
    setStore(data)
  }

  useEffect(() => {
    refresh()
  }, [])

  const selected = store.templates.find(t => t.id === selectedId) ?? null

  return (
    <div className="templates-screen">
      <TemplateList
        templates={store.templates}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={async () => {
          const name = `Template ${store.templates.length + 1}`
          const t = await window.api.createTemplate(name)
          await refresh()
          setSelectedId(t.id)
        }}
        onDelete={async (id) => {
          await window.api.deleteTemplate(id)
          if (selectedId === id) setSelectedId(null)
          await refresh()
        }}
        onDuplicate={async (id) => {
          const copy = await window.api.duplicateTemplate(id)
          await refresh()
          if (copy) setSelectedId(copy.id)
        }}
      />
      <div className="templates-right">
        {selected ? (
          <TemplateEditor
            key={selected.id}
            template={selected}
            onChange={refresh}
          />
        ) : (
          <div className="templates-placeholder">Select a template or create one</div>
        )}
        <PersonnelSection
          heading="Instructors"
          items={store.instructors}
          onAdd={async (name) => { await window.api.addInstructor(name); await refresh() }}
          onRename={async (i, name) => { await window.api.renameInstructor(i, name); await refresh() }}
          onRemove={async (i) => { await window.api.removeInstructor(i); await refresh() }}
        />
        <PersonnelSection
          heading="Simulators"
          items={store.simulators}
          onAdd={async (name) => { await window.api.addSimulator(name); await refresh() }}
          onRename={async (i, name) => { await window.api.renameSimulator(i, name); await refresh() }}
          onRemove={async (i) => { await window.api.removeSimulator(i); await refresh() }}
        />
      </div>
    </div>
  )
}

// ── Template list sidebar ─────────────────────────────────────────────────────

interface TemplateListProps {
  templates: NamedTemplate[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

function TemplateList({ templates, selectedId, onSelect, onAdd, onDelete, onDuplicate }: TemplateListProps) {
  return (
    <div className="template-list">
      <div className="template-list-header">
        <span className="section-heading">Templates</span>
        <button className="btn-icon" onClick={onAdd} title="New template">+</button>
      </div>
      <ul className="template-list-items">
        {templates.map(t => (
          <li
            key={t.id}
            className={`template-list-item${selectedId === t.id ? ' selected' : ''}`}
            onClick={() => onSelect(t.id)}
          >
            <span className="template-list-name">{t.name}</span>
            <span className="template-list-actions">
              <button
                className="btn-icon"
                title="Duplicate"
                onClick={(e) => { e.stopPropagation(); onDuplicate(t.id) }}
              >⎘</button>
              <button
                className="btn-icon btn-danger"
                title="Delete"
                onClick={(e) => { e.stopPropagation(); onDelete(t.id) }}
              >×</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Template editor ───────────────────────────────────────────────────────────

interface TemplateEditorProps {
  template: NamedTemplate
  onChange: () => void
}

function TemplateEditor({ template, onChange }: TemplateEditorProps) {
  const [name, setName] = useState(template.name)
  const [prefix, setPrefix] = useState('')
  const [count, setCount] = useState(5)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const itemEdit = useInlineEdit()

  const saveItems = async (items: TemplateItem[]) => {
    await window.api.updateTemplate(template.id, { items })
    onChange()
  }

  const handleNameBlur = async () => {
    if (name.trim() && name !== template.name) {
      await window.api.updateTemplate(template.id, { name: name.trim() })
      onChange()
    } else {
      setName(template.name)
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') nameInputRef.current?.blur()
    if (e.key === 'Escape') { setName(template.name); nameInputRef.current?.blur() }
  }

  const handleGroupAdd = async () => {
    const p = prefix.trim()
    if (!p || count < 1) return
    const padWidth = Math.max(2, String(count).length)
    const newItems = Array.from({ length: count }, (_, i) => ({
      name: `${p}-${String(i + 1).padStart(padWidth, '0')}`,
      type: 'run' as const,
    }))
    await saveItems([...template.items, ...newItems])
    setPrefix('')
    setCount(5)
  }

  const handleItemRenameCommit = async (index: number) => {
    const trimmed = itemEdit.editingName.trim()
    if (trimmed && trimmed !== template.items[index].name) {
      const items = template.items.map((item, i) =>
        i === index ? { ...item, name: trimmed } : item,
      )
      await saveItems(items)
    }
    itemEdit.cancelEditing()
  }

  const handleDeleteItem = async (index: number) => {
    await saveItems(template.items.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDropIndex(index)
  }

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDropIndex(null)
      return
    }
    const items = [...template.items]
    const [moved] = items.splice(dragIndex, 1)
    items.splice(targetIndex, 0, moved)
    setDragIndex(null)
    setDropIndex(null)
    await saveItems(items)
  }

  return (
    <div className="template-editor">
      <input
        ref={nameInputRef}
        className="template-name-input"
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={handleNameBlur}
        onKeyDown={handleNameKeyDown}
        aria-label="Template name"
      />

      <section className="editor-section">
        <h3 className="section-heading">Add items</h3>
        <div className="group-entry">
          <input
            className="input-sm"
            placeholder="Prefix (e.g. BSP)"
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGroupAdd()}
          />
          <input
            className="input-sm input-number"
            type="number"
            min={1}
            max={99}
            value={count}
            onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <button className="btn" onClick={handleGroupAdd}>Add</button>
        </div>
      </section>

      <section className="editor-section">
        <h3 className="section-heading">Items ({template.items.length})</h3>
        {template.items.length === 0 ? (
          <p className="empty-hint">No items yet. Use "Add items" above.</p>
        ) : (
          <ul className="items-list">
            {template.items.map((item, i) => (
              <li
                key={item.name}
                className={`item-row${dropIndex === i && dragIndex !== i ? ' drop-target' : ''}`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIndex(null); setDropIndex(null) }}
              >
                <span className="drag-handle">⠿</span>
                {itemEdit.editingIndex === i ? (
                  <input
                    className="input-sm item-name-input"
                    value={itemEdit.editingName}
                    autoFocus
                    onChange={e => itemEdit.setEditingName(e.target.value)}
                    onBlur={() => handleItemRenameCommit(i)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleItemRenameCommit(i)
                      if (e.key === 'Escape') itemEdit.cancelEditing()
                    }}
                  />
                ) : (
                  <span
                    className="item-name"
                    onDoubleClick={() => itemEdit.startEditing(i, item.name)}
                    title="Double-click to rename"
                  >
                    {item.name}
                  </span>
                )}
                <span className={`item-type-badge item-type-${item.type}`}>{item.type}</span>
                <button
                  className="btn-icon btn-danger"
                  title="Remove item"
                  onClick={() => handleDeleteItem(i)}
                >×</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

// ── Personnel section (instructors / simulators) ──────────────────────────────

interface PersonnelSectionProps {
  heading: string
  items: string[]
  onAdd: (name: string) => void
  onRename: (index: number, name: string) => void
  onRemove: (index: number) => void
}

function PersonnelSection({ heading, items, onAdd, onRename, onRemove }: PersonnelSectionProps) {
  const [newName, setNewName] = useState('')
  const edit = useInlineEdit()

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    onAdd(name)
    setNewName('')
  }

  const handleRenameCommit = (index: number) => {
    const name = edit.editingName.trim()
    if (name && name !== items[index]) onRename(index, name)
    edit.cancelEditing()
  }

  return (
    <section className="editor-section">
      <h3 className="section-heading">{heading}</h3>
      <div className="add-row">
        <input
          className="input-sm"
          placeholder={`Add ${heading.toLowerCase().slice(0, -1)}`}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn" onClick={handleAdd}>Add</button>
      </div>
      {items.length > 0 && (
        <ul className="items-list">
          {items.map((item, i) => (
            <li key={item} className="item-row">
              {edit.editingIndex === i ? (
                <input
                  className="input-sm item-name-input"
                  value={edit.editingName}
                  autoFocus
                  onChange={e => edit.setEditingName(e.target.value)}
                  onBlur={() => handleRenameCommit(i)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameCommit(i)
                    if (e.key === 'Escape') edit.cancelEditing()
                  }}
                />
              ) : (
                <span
                  className="item-name"
                  onDoubleClick={() => edit.startEditing(i, item)}
                  title="Double-click to rename"
                >
                  {item}
                </span>
              )}
              <button
                className="btn-icon btn-danger"
                title="Remove"
                onClick={() => onRemove(i)}
              >×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
