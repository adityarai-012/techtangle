import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Trophy, Medal } from "lucide-react";

export default function Leaderboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/leaderboard?limit=50");
      setItems(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 animate-fade-up">
        <p className="overline">Global Rankings</p>
        <h1 className="text-4xl font-black tracking-tight">Leaderboard</h1>
        <p className="text-slate-500 mt-2">Top 50 puzzle solvers on TechTangle.</p>
      </div>

      {loading && <div className="text-center text-slate-400 overline py-20">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center" data-testid="leaderboard-empty">
          <Trophy className="mx-auto text-amber-500 mb-3" size={32} />
          <h2 className="text-xl font-bold mb-1">No players yet</h2>
          <p className="text-slate-500 text-sm">Be the first to solve a puzzle and claim the top spot!</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200">
            <div className="col-span-1 overline">Rank</div>
            <div className="col-span-6 overline">Player</div>
            <div className="col-span-3 overline">Tier</div>
            <div className="col-span-2 overline text-right">Points</div>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors" data-testid={`leaderboard-row-${p.rank}`}>
                <div className="col-span-1">
                  {p.rank <= 3 ? (
                    <Medal
                      className={p.rank === 1 ? "text-amber-500" : p.rank === 2 ? "text-slate-400" : "text-orange-500"}
                      size={22}
                    />
                  ) : (
                    <span className="font-mono font-bold text-slate-500">#{p.rank}</span>
                  )}
                </div>
                <div className="col-span-6">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{p.puzzles_solved} solved</div>
                </div>
                <div className="col-span-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full tier-dot-${p.current_level} text-white`}>
                    {p.current_level}
                  </span>
                </div>
                <div className="col-span-2 text-right font-mono font-black text-lg">{p.points}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
