import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const TIERS = ["beginner", "intermediate", "advanced", "expert"];

const empty = { word: "", definition: "", category: "General", difficulty: "beginner", points_reward: 10 };

export default function AdminPuzzles() {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null); // null | {} (new) | {...} (existing)
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await api.get("/admin/puzzles");
    setPuzzles(data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = filter === "all" ? puzzles : puzzles.filter((p) => p.difficulty === filter);

  const openNew = () => { setForm(empty); setEditing({}); setError(""); };
  const openEdit = (p) => { setForm({ word: p.word, definition: p.definition, category: p.category, difficulty: p.difficulty, points_reward: p.points_reward }); setEditing(p); setError(""); };
  const close = () => { setEditing(null); setError(""); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing && editing.id) {
        await api.put(`/admin/puzzles/${editing.id}`, form);
      } else {
        await api.post("/admin/puzzles", form);
      }
      close();
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this puzzle?")) return;
    await api.delete(`/admin/puzzles/${id}`);
    fetchAll();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="overline">Content Management</p>
          <h1 className="text-4xl font-black tracking-tight">Puzzles</h1>
          <p className="text-slate-500 mt-2">Manage the puzzle pool. {puzzles.length} total.</p>
        </div>
        <button onClick={openNew} className="btn-action inline-flex items-center gap-2" data-testid="admin-new-puzzle-button">
          <Plus size={18} /> New Puzzle
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${filter === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200"}`}
          data-testid="admin-filter-all"
        >
          All
        </button>
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${filter === t ? `tier-dot-${t} text-white` : "bg-white text-slate-500 border border-slate-200"}`}
            data-testid={`admin-filter-${t}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <div className="text-slate-400 overline">Loading…</div>}

      {!loading && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200">
            <div className="col-span-3 overline">Word</div>
            <div className="col-span-5 overline">Definition</div>
            <div className="col-span-2 overline">Tier · Category</div>
            <div className="col-span-1 overline">Pts</div>
            <div className="col-span-1 overline text-right">Actions</div>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.length === 0 && <div className="p-6 text-center text-slate-400">No puzzles in this view.</div>}
            {filtered.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-slate-50" data-testid={`puzzle-row-${p.id}`}>
                <div className="col-span-3 font-mono font-bold">{p.word}</div>
                <div className="col-span-5 text-sm text-slate-600 truncate">{p.definition}</div>
                <div className="col-span-2">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full tier-dot-${p.difficulty} text-white mr-1`}>{p.difficulty}</span>
                  <div className="text-xs text-slate-400 mt-1">{p.category}</div>
                </div>
                <div className="col-span-1 font-mono text-sm">{p.points_reward}</div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-slate-100" data-testid={`puzzle-edit-${p.id}`}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" data-testid={`puzzle-delete-${p.id}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing !== null && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-slide-down" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black tracking-tight">{editing.id ? "Edit puzzle" : "New puzzle"}</h2>
              <button onClick={close} className="p-2 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="overline block mb-1.5">Word (answer)</label>
                <input
                  type="text"
                  required
                  value={form.word}
                  onChange={(e) => setForm({ ...form, word: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg font-mono uppercase"
                  placeholder="POLYMORPHISM"
                  data-testid="puzzle-form-word"
                />
              </div>
              <div>
                <label className="overline block mb-1.5">Definition</label>
                <textarea
                  required
                  rows={3}
                  value={form.definition}
                  onChange={(e) => setForm({ ...form, definition: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                  placeholder="The definition the student will see…"
                  data-testid="puzzle-form-definition"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="overline block mb-1.5">Tier</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full px-3 py-3 border border-slate-200 rounded-lg bg-white capitalize"
                    data-testid="puzzle-form-difficulty"
                  >
                    {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="overline block mb-1.5">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-3 border border-slate-200 rounded-lg"
                    placeholder="OOP"
                    data-testid="puzzle-form-category"
                  />
                </div>
                <div>
                  <label className="overline block mb-1.5">Points</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={form.points_reward}
                    onChange={(e) => setForm({ ...form, points_reward: Number(e.target.value) })}
                    className="w-full px-3 py-3 border border-slate-200 rounded-lg font-mono"
                    data-testid="puzzle-form-points"
                  />
                </div>
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={close} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary text-sm" data-testid="puzzle-form-save">
                  {saving ? "Saving…" : "Save Puzzle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
