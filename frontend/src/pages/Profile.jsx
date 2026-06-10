import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Award, Flame, Target, TrendingUp } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/profile");
      setData(data);
    })();
  }, []);

  if (!user || !data) {
    return <div className="text-center text-slate-400 overline py-20">Loading…</div>;
  }

  const { stats } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 animate-fade-up">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center">
            <span className="text-white font-black text-2xl">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="overline">Your Profile</p>
            <h1 className="text-3xl font-black tracking-tight" data-testid="profile-name">{user.name}</h1>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
          <div className="text-right">
            <p className="overline">Global Rank</p>
            <p className="text-3xl font-black font-mono" data-testid="profile-rank">#{stats.global_rank}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={<TrendingUp size={16} />} label="Total Points" value={user.points} mono />
        <Stat icon={<Target size={16} />} label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat icon={<Flame size={16} className="text-amber-500" />} label="Current Streak" value={user.streak} mono />
        <Stat icon={<Award size={16} />} label="Badges" value={user.badges?.length || 0} mono />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6">
          <p className="overline mb-4">Attempts</p>
          <div className="space-y-3 text-sm">
            <Row label="Total attempts" value={stats.total_attempts} />
            <Row label="Correct" value={stats.correct_attempts} />
            <Row label="Accuracy" value={`${stats.accuracy}%`} />
            <Row label="Current tier" value={<span className={`tier-text-${user.current_level} capitalize font-bold`}>{user.current_level}</span>} />
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <p className="overline mb-4">Badges & Achievements</p>
          {user.badges && user.badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="profile-badges">
              {user.badges.map((b) => (
                <div key={b} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Award className="text-amber-600" size={18} />
                  </div>
                  <span className="font-bold text-sm leading-tight">{b}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10" data-testid="profile-no-badges">
              <Award size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Solve puzzles to earn your first badge!</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
        <p className="overline mb-4">Tier Progress</p>
        <div className="space-y-4">
          {Object.entries(user.level_progress || {}).map(([lvl, solved]) => (
            <div key={lvl}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className={`capitalize font-bold tier-text-${lvl}`}>{lvl}</span>
                <span className="font-mono text-slate-500">{solved} solved</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full tier-dot-${lvl}`} style={{ width: `${Math.min(100, solved * 10)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, mono }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="overline">{label}</p>
        {icon}
      </div>
      <p className={`text-3xl font-black ${mono ? "font-mono" : ""} text-slate-900`}>{value}</p>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
