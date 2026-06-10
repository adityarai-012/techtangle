import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { Flame, Award, Trophy, Lock, CheckCircle2, ArrowRight } from "lucide-react";

const TIER_INFO = {
  beginner: { label: "Beginner", color: "blue", desc: "Core CS vocabulary" },
  intermediate: { label: "Intermediate", color: "violet", desc: "Compilers, OS, data" },
  advanced: { label: "Advanced", color: "amber", desc: "Algorithms & OOP" },
  expert: { label: "Expert", color: "red", desc: "Distributed & concurrency" },
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [levels, setLevels] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [levelsRes, lbRes] = await Promise.all([
          api.get("/levels"),
          api.get("/leaderboard?limit=5"),
        ]);
        setLevels(levelsRes.data);
        setLeaderboard(lbRes.data);
      } finally {
        setLoading(false);
      }
    })();
    refreshUser();
  }, [refreshUser]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Greeting */}
      <div className="mb-8 animate-fade-up">
        <p className="overline">Welcome back</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-1" data-testid="dashboard-greeting">
          Hello, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-slate-500 mt-2">Keep the streak alive. Every puzzle solved is one concept locked in.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Points" value={user.points} testId="stat-points" mono />
        <StatCard label="Puzzles Solved" value={user.puzzles_solved} testId="stat-solved" mono />
        <StatCard label="Current Streak" value={user.streak} testId="stat-streak" icon={<Flame size={16} className="text-amber-500" />} mono />
        <StatCard label="Badges Earned" value={user.badges?.length || 0} testId="stat-badges" icon={<Award size={16} className="text-slate-500" />} mono />
      </div>

      {/* Levels grid + Leaderboard */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="overline">Tier Progression</p>
              <h2 className="text-2xl font-bold tracking-tight">Choose your level</h2>
            </div>
            <Link to="/play" className="btn-primary text-sm inline-flex items-center gap-2" data-testid="dashboard-play-link">
              Continue playing <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />)
              : levels.map((lvl) => (
                  <LevelCard key={lvl.level} level={lvl} />
                ))}
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="overline">Top players</p>
              <h2 className="text-2xl font-bold tracking-tight">Leaderboard</h2>
            </div>
            <Link to="/leaderboard" className="text-xs font-semibold text-slate-500 hover:text-slate-900" data-testid="dashboard-leaderboard-link">
              View all →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {leaderboard.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">
                <Trophy size={28} className="mx-auto mb-2 opacity-40" />
                Be the first on the board!
              </div>
            )}
            {leaderboard.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-3" data-testid={`leaderboard-row-${p.rank}`}>
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-black ${
                  p.rank === 1 ? "bg-amber-100 text-amber-700" :
                  p.rank === 2 ? "bg-slate-200 text-slate-700" :
                  p.rank === 3 ? "bg-orange-100 text-orange-700" :
                  "bg-slate-50 text-slate-500"
                }`}>
                  {p.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{p.current_level}</div>
                </div>
                <div className="font-mono font-bold text-sm">{p.points}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, testId, icon, mono }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow" data-testid={testId}>
      <div className="flex items-center justify-between mb-2">
        <p className="overline">{label}</p>
        {icon}
      </div>
      <p className={`text-3xl font-black ${mono ? "font-mono" : ""} text-slate-900`}>{value ?? 0}</p>
    </div>
  );
}

function LevelCard({ level }) {
  const info = TIER_INFO[level.level];
  const progressPct = level.total > 0 ? Math.min(100, (level.solved / level.total) * 100) : 0;
  return (
    <Link
      to={level.unlocked ? `/play?level=${level.level}` : "#"}
      className={`relative bg-white rounded-xl border-2 p-5 transition-all ${
        level.unlocked
          ? `tier-border-${level.level} hover:shadow-md cursor-pointer`
          : "border-slate-200 opacity-60 cursor-not-allowed"
      }`}
      onClick={(e) => { if (!level.unlocked) e.preventDefault(); }}
      data-testid={`level-card-${level.level}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full tier-dot-${level.level}`} />
          <span className={`overline tier-text-${level.level}`}>{info.label}</span>
        </div>
        {level.unlocked
          ? <CheckCircle2 size={16} className="text-emerald-500" />
          : <Lock size={16} className="text-slate-400" />}
      </div>
      <h3 className="text-lg font-bold mb-1">{info.desc}</h3>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-mono text-slate-500">{level.solved}/{level.total} solved</span>
          {!level.unlocked && <span className="text-xs text-slate-400">Solve {level.puzzles_needed_to_unlock_next} prior to unlock</span>}
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full tier-dot-${level.level}`} style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </Link>
  );
}
