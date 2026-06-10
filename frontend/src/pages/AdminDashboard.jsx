import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { Users, Puzzle, Activity, Target, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/admin/stats");
      setStats(data);
    })();
  }, []);

  if (!stats) return <div className="text-center text-slate-400 overline py-20">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 animate-fade-up">
        <p className="overline">Admin Control</p>
        <h1 className="text-4xl font-black tracking-tight">Operations Dashboard</h1>
        <p className="text-slate-500 mt-2">Monitor platform activity and manage puzzle content.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Total Students" value={stats.total_users} icon={<Users size={16} />} testId="admin-stat-users" />
        <Stat label="Total Puzzles" value={stats.total_puzzles} icon={<Puzzle size={16} />} testId="admin-stat-puzzles" />
        <Stat label="Total Attempts" value={stats.total_attempts} icon={<Activity size={16} />} testId="admin-stat-attempts" />
        <Stat label="Success Rate" value={`${stats.success_rate}%`} icon={<Target size={16} />} testId="admin-stat-success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="overline mb-4">Puzzles by tier</p>
          <div className="space-y-3">
            {stats.by_difficulty.map((d) => (
              <div key={d.level}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className={`tier-text-${d.level} capitalize font-bold`}>{d.level}</span>
                  <span className="font-mono">{d.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full tier-dot-${d.level}`} style={{ width: `${stats.total_puzzles > 0 ? (d.count / stats.total_puzzles) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="overline mb-4">Top categories</p>
          {stats.by_category.length === 0 && <p className="text-sm text-slate-400">No data</p>}
          <div className="grid grid-cols-2 gap-2">
            {stats.by_category.map((c) => (
              <div key={c.category} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-sm font-semibold truncate">{c.category}</div>
                <div className="text-xs text-slate-500 font-mono">{c.count} puzzles</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link to="/admin/puzzles" className="block bg-slate-900 text-white rounded-xl p-6 hover:bg-slate-800 transition-colors" data-testid="admin-manage-puzzles-link">
        <div className="flex items-center justify-between">
          <div>
            <p className="overline text-slate-400">Content Management</p>
            <h2 className="text-xl font-bold mt-1">Manage Puzzles →</h2>
            <p className="text-sm text-slate-400 mt-1">Add, edit, or remove CS vocabulary puzzles.</p>
          </div>
          <ArrowRight size={28} />
        </div>
      </Link>
    </div>
  );
}

function Stat({ label, value, icon, testId }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5" data-testid={testId}>
      <div className="flex items-center justify-between mb-2">
        <p className="overline">{label}</p>
        {icon}
      </div>
      <p className="text-3xl font-black font-mono">{value}</p>
    </div>
  );
}
