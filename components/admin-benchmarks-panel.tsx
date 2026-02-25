"use client"

import { useState, useEffect } from "react"
import { Plus, Save, Trash2, X, Pencil } from "lucide-react"

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
  conversion_rate: 2,
  average_order_value: 95,
  gross_margin: 45,
  return_rate: 15,
  net_margin: 12,
  cr_improvement_conservative: 0.3,
  cr_improvement_moderate: 0.5,
  cr_improvement_optimistic: 1.0,
}

type FormData = typeof EMPTY_FORM

const pct = (n: number) => +(n * 100).toFixed(4)
const dec = (n: number) => +(n / 100)

const inputCls = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
const labelCls = "block text-xs text-muted-foreground mb-1 font-medium"

function FormFields({
  form,
  onChange,
  showValue = false,
}: {
  form: FormData
  onChange: (f: Partial<FormData>) => void
  showValue?: boolean
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {showValue && (
        <div className="col-span-2 md:col-span-3 grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Key (slug, no spaces)</label>
            <input
              className={inputCls}
              value={form.value}
              onChange={e => onChange({ value: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              placeholder="e.g. fashion"
            />
          </div>
          <div>
            <label className={labelCls}>Display name</label>
            <input
              className={inputCls}
              value={form.label}
              onChange={e => onChange({ label: e.target.value })}
              placeholder="e.g. Fashion & Apparel"
            />
          </div>
        </div>
      )}
      {!showValue && (
        <div className="col-span-2 md:col-span-3">
          <label className={labelCls}>Display name</label>
          <input
            className={inputCls}
            value={form.label}
            onChange={e => onChange({ label: e.target.value })}
            placeholder="e.g. Fashion & Apparel"
          />
        </div>
      )}
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
        <label className={labelCls}>CR Uplift Conservative (%)</label>
        <input type="number" step="0.01" className={inputCls} value={form.cr_improvement_conservative} onChange={e => onChange({ cr_improvement_conservative: +e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>CR Uplift Moderate (%)</label>
        <input type="number" step="0.01" className={inputCls} value={form.cr_improvement_moderate} onChange={e => onChange({ cr_improvement_moderate: +e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>CR Uplift Optimistic (%)</label>
        <input type="number" step="0.01" className={inputCls} value={form.cr_improvement_optimistic} onChange={e => onChange({ cr_improvement_optimistic: +e.target.value })} />
      </div>
    </div>
  )
}

export function BenchmarksPanel() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<FormData>(EMPTY_FORM)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const headers = { "x-admin-user": "ollie" }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/industry-benchmarks", { headers })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setBenchmarks(await res.json())
    } catch (e: any) {
      setError(e.message || "Failed to load benchmarks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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

  function flash(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  async function saveEdit(id: number) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/industry-benchmarks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
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
      flash("Saved successfully")
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
      await fetch(`/api/admin/industry-benchmarks?id=${id}`, { method: "DELETE", headers })
      flash("Deleted")
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
        headers: { "Content-Type": "application/json", ...headers },
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
      flash("Industry added")
      await load()
    } catch (e: any) {
      setError(e.message || "Failed to add")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Industry Benchmarks</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Default values used in the ROI calculator for each industry type.
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Add industry
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 border border-border rounded-xl p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">New Industry</h3>
            <button type="button" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM) }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <FormFields form={addForm} onChange={f => setAddForm(prev => ({ ...prev, ...f }))} showValue />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM) }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !addForm.value || !addForm.label}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Adding..." : "Add Industry"}
            </button>
          </div>
        </div>
      )}

      {/* Benchmark list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {benchmarks.map(b => (
            <div key={b.id} className="border border-border rounded-xl overflow-hidden bg-card">
              {editingId === b.id ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Editing: {b.label}</h3>
                    <button type="button" onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <FormFields form={editForm} onChange={f => setEditForm(prev => ({ ...prev, ...f }))} />
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                    <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(b.id)}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.label}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{b.value}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <span>CR: {pct(b.conversion_rate)}%</span>
                      <span>AOV: £{b.average_order_value}</span>
                      <span>GM: {pct(b.gross_margin)}%</span>
                      <span>Sessions: {b.monthly_sessions.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id, b.label)}
                      className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
