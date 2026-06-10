import { Link } from "react-router-dom";
import { ArrowRight, Brain, Zap, Trophy, ShieldCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
              <span className="text-white font-black text-sm font-mono">TT</span>
            </div>
            <span className="font-black text-lg tracking-tight">TechTangle</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary" data-testid="landing-login-link">Sign in</Link>
            <Link to="/register" className="btn-primary" data-testid="landing-register-link">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 sm:py-28 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="overline">Gamified CS Learning</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] text-slate-900">
                Untangle the<br />
                language of<br />
                <span className="relative inline-block">
                  computer science
                  <span className="absolute -bottom-2 left-0 right-0 h-3 bg-emerald-300/60 -z-10" />
                </span>.
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
                Master polymorphism, recursion, normalization and 40+ core CS concepts through tactile anagram puzzles. Level up. Earn badges. Climb the leaderboard.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/register" className="btn-action inline-flex items-center gap-2" data-testid="landing-cta-start">
                  Start Playing Free <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary" data-testid="landing-cta-signin">I have an account</Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2"><Brain size={16} /> 40+ Puzzles</div>
                <div className="flex items-center gap-2"><Trophy size={16} /> Live Leaderboard</div>
                <div className="flex items-center gap-2"><ShieldCheck size={16} /> Free to play</div>
              </div>
            </div>

            {/* Puzzle preview card */}
            <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="overline">Sample Puzzle</span>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-500 text-white">Beginner</span>
                </div>
                <p className="text-slate-700 leading-relaxed mb-6">
                  "A linear data structure following Last-In-First-Out ordering."
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {["T", "C", "S", "A", "K"].map((c, i) => (
                    <div key={i} className="anagram-tile">{c}</div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["S", "T", "A", "C", "K"].map((c, i) => (
                    <div key={i} className="slot-tile filled">{c}</div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                  <span>5 letters</span>
                  <span className="font-mono font-bold text-emerald-600">+10 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "Progressive levels", desc: "Beginner → Intermediate → Advanced → Expert. Unlock tiers as you master each.", color: "blue" },
            { icon: Zap, title: "Instant feedback", desc: "Wrong answers reveal the definition — turning every miss into a learning moment.", color: "amber" },
            { icon: Trophy, title: "Compete & track", desc: "Global leaderboard, achievement badges, streaks, and full profile analytics.", color: "emerald" },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center mb-4">
                <f.icon className="text-white" size={20} />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} TechTangle — Gamified learning for the curious CS mind.
        </div>
      </footer>
    </div>
  );
}
