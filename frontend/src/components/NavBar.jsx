import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Trophy, LayoutDashboard, Puzzle, User, Settings } from "lucide-react";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const linkClass = (path) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      pathname === path
        ? "bg-slate-900 text-white"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2" data-testid="nav-logo">
          <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center">
            <span className="text-white font-black text-sm font-mono">TT</span>
          </div>
          <span className="font-black text-lg tracking-tight" style={{ fontFamily: "Outfit" }}>TechTangle</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {isAdmin ? (
            <>
              <Link to="/admin" className={linkClass("/admin")} data-testid="nav-admin-dashboard">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/admin/puzzles" className={linkClass("/admin/puzzles")} data-testid="nav-admin-puzzles">
                <Puzzle size={16} /> Puzzles
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className={linkClass("/dashboard")} data-testid="nav-dashboard">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/play" className={linkClass("/play")} data-testid="nav-play">
                <Puzzle size={16} /> Play
              </Link>
              <Link to="/leaderboard" className={linkClass("/leaderboard")} data-testid="nav-leaderboard">
                <Trophy size={16} /> Leaderboard
              </Link>
              <Link to="/profile" className={linkClass("/profile")} data-testid="nav-profile">
                <User size={16} /> Profile
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pts</span>
            <span className="font-mono font-bold text-slate-900" data-testid="nav-points">
              {user.points ?? 0}
            </span>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            data-testid="nav-logout-button"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
