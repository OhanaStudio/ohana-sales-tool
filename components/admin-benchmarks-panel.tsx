"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Plus, Save, Trash2, X, Pencil } from "lucide-react"

interface Benchmark {
  id: number
  value: string
  label: string
  monthly_sessions: number
  conversion_rate: number
  average_order_value: number
  gross_margin: number
  return_rate: number
  net_margin: number
  cr_improvement_conservative: number
  cr_improvement_moderate: number
  cr_improvement_optimistic: number
}

const EMPTY_FORM = {
  value: "",
  label: "",
  monthly_sessions: 50000,
  conversion_rate: 0.02,
  average_order_value: 95,
  gross_margin: 0.45,
  return_rate: 0.15,
  net_margin: 0.12,
  cr_improvement_conservative: 0.003,
  cr_improvement_moderate: 0.005,
  cr_improvement_optimistic: 0.01,
}

type FormData = typeof EMPTY_FORM

const pct = (n: number) => +(n * 100).toFixed(4)
const dec = (n: number) => +(n / 100)

export function AdminBenchmarksPanel() {
  const [open, setOpen] = useState(false)
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<FormData>(EMPTY_FORM)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const adminHeaders = { "x-admin-user": "ollie" }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/industry-benchmarks", { headers: adminHeaders })
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
      setBenchmarks(await res.json())
    } catch (e: any) {
      setError(e.message || "Failed to load benchmarks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && benchmarks.length === 0) load()
  }, [open])

  function startEdit(b: Benchmark) {
    setEditingId(b.id)
    setEditForm({
      value: b.value,
      label: b.label,
      monthly_sessions: b.monthly_sessions,
      conversion_rate: pct(b.conversion_rate),
      average_order_value: b.average_order_value,
      gross_margin: pct(b.gross_margin),
      return_rate: pct(b.return_rate),
      net_margin: pct(b.net_margin),
      cr_improvement_conservative: pct(b.cr_improvement_conservative),
      cr_improvement_moderate: pct(b.cr_improvement_moderate),
      cr_improvement_optimistic: pct(b.cr_improvement_optimistic),
    })
  }

  async function saveEdit(id: number) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/industry-benchmarks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...adminHeaders },
        body: JSON.stringify({
          id,
          label: editForm.label,
          monthly_sessions: Number(editForm.monthly_sessions),
          conversion_rate: dec(Number(editForm.conversion_rate)),
          average_order_value: Number(editForm.average_order_value),
          gross_margin: dec(Number(editForm.gross_margin)),
          return_rate: dec(Number(editForm.return_rate)),
          net_margin: dec(Number(editForm.net_margin)),
          cr_improvement_conservative: dec(Number(editForm.cr_improvement_conservative)),
          cr_improvement_moderate: dec(Number(editForm.cr_improvement_moderate)),
          cr_improvement_optimistic: dec(Number(editForm.cr_improvement_optimistic)),
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      setEditingId(null)
      await load()
    } catch {
      setError("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, label: string) {
    if (!confirm(`Delete "${label}"?`)) return
    try {
      await fetch(`/api/admin/industry-benchmarks?id=${id}`, { method: "DELETE", headers: adminHeaders })
      await load()
    } catch {
      setError("Failed to delete")
    }
  }

  async function handleAdd() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/industry-benchmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders },
        body: JSON.stringify({
          value: addForm.value,
          label: addForm.label,
          monthly_sessions: Number(addForm.monthly_sessions),
          conversion_rate: dec(Number(addForm.conversion_rate)),
          average_order_value: Number(addForm.average_order_value),
          gross_margin: dec(Number(addForm.gross_margin)),
          return_rate: dec(Number(addForm.return_rate)),
          net_margin: dec(Number(addForm.net_margin)),
          cr_improvement_conservative: dec(Number(addForm.cr_improvement_conservative)),
          cr_improvement_moderate: dec(Number(addForm.cr_improvement_moderate)),
          cr_improvement_optimistic: dec(Number(addForm.cr_improvement_optimistic)),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Add failed")
      }
      setShowAddForm(false)
      setAddForm(EMPTY_FORM)
      await load()
    } catch (e: any) {
      setError(e.message || "Failed to add")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
  const labelCls = "block text-[10px] text-zinc-500 mb-0.5"

  function BenchmarkFormFields({
    form,
    onChange,
    showValue = false,
  }: {
    form: FormData
    onChange: (f: Partial<FormData>) => void
    showValue?: boolean
  }) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {showValue && (
          <div className="col-span-2 md:col-span-2">
            <label className={labelCls}>Key (slug, no spaces)</label>
            <input className={inputCls} value={form.value} onChange={e => onChange({ value: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="e.g. fashion" />
          </div>
        )}
        <div className={showValue ? "col-span-2" : "col-span-2 md:col-span-4"}>
          <label className={labelCls}>Label (display name)</label>
          <input className={inputCls} value={form.label} onChange={e => onChange({ label: e.target.value })} placeholder="e.g. Fashion & Apparel" />
        </div>
        <div>
          <label className={labelCls}>Monthly Sessions</label>
          <input type="number" className={inputCls} value={form.monthly_sessions} onChange={e => onChange({ monthly_sessions: +e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Conversion Rate (%)</label>
          <input type="number" step="0.01" className={inputCls} value={form.conversion_rate} onChange={e => onChange({ conversion_rate: +e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Avg Order Value (£)</label>
          <input type="number" className={inputCls} value={form.average_order_value} onChange={e => onChange({ average_order_value: +e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Gross Margin (%)</label>
          <input type="number" step="0.1" className={inputCls} value={form.gross_margin} onChange={e => onChange({ gross_margin: +e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Return Rate (%)</label>
          <input type="number" step="0.1" className={inputCls} value={form.return_rate} onChange={e => onChange({ return_rate: +e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Net Margin (%)</label>
          <input type="number" step="0.1" className={inputCls} value={form.net_margin} onChange={e => onChange({ net_margin: +e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>CR Improvement Conservative (%)</label>
          <input type="number" step="0.01" className={inputCls} value={form.cr_improvement_conservative} onChange={e => onChange({ cr_improvement_conservative: +e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>CR Improvement Moderate (%)</label>
          <input type="number" step="0.01" className={inputCls} value={form.cr_improvement_moderate} onChange={e => onChange({ cr_improvement_moderate: +e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>CR Improvement Optimistic (%)</label>
          <input type="number" step="0.01" className={inputCls} value={form.cr_improvement_optimistic} onChange={e => onChange({ cr_improvement_optimistic: +e.target.value })} />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-12 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">Admin</span>
          <span className="text-sm font-medium text-zinc-300">Industry Benchmark Defaults</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
      </button>

      {open && (
        <div className="border-t border-zinc-800 p-6">
          {error && (
            <div className="mb-4 px-4 py-2 bg-red-950 border border-red-800 rounded text-xs text-red-400">{error}</div>
          )}

          {loading ? (
            <p className="text-xs text-zinc-600">Loading...</p>
          ) : (
            <>
              {/* Benchmark rows */}
              <div className="space-y-2 mb-6">
                {benchmarks.map(b => (
                  <div key={b.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                    {editingId === b.id ? (
                      /* Edit mode */
                      <div className="p-4 bg-zinc-900">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-zinc-300">Editing: <span className="text-white">{b.label}</span></span>
                          <button type="button" onClick={() => setEditingId(null)} className="text-zinc-600 hover:text-zinc-400">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <BenchmarkFormFields
                          form={editForm}
                          onChange={f => setEditForm(prev => ({ ...prev, ...f }))}
                        />
                        <div className="flex justify-end gap-2 mt-4">
                          <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(b.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-medium rounded hover:bg-zinc-200 transition-colors disabled:opacity-50"
                          >
                            <Save className="h-3 w-3" />
                            {saving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Row view */
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <span className="font-mono text-[10px] text-zinc-600 shrink-0 w-28 truncate">{b.value}</span>
                          <span className="text-xs text-zinc-300 truncate">{b.label}</span>
                          <span className="text-[10px] text-zinc-600 shrink-0 hidden md:block">CR: {pct(b.conversion_rate)}% · AOV: £{b.average_order_value} · GM: {pct(b.gross_margin)}%</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-4">
                          <button type="button" onClick={() => startEdit(b)} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors" aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => handleDelete(b.id, b.label)} className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors" aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new */}
              {showAddForm ? (
                <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-300">New Industry</span>
                    <button type="button" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM) }} className="text-zinc-600 hover:text-zinc-400">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <BenchmarkFormFields
                    form={addForm}
                    onChange={f => setAddForm(prev => ({ ...prev, ...f }))}
                    showValue
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM) }} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={saving || !addForm.value || !addForm.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-medium rounded hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      {saving ? "Adding..." : "Add Industry"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-zinc-700 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors w-full justify-center"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add new industry
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
