import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Login failed");
      return;
    }
    const role = res?.user?.role;
    // useAuth state will update; redirect by reading from API result if available
    navigate(role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 grid-bg">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center">
            <span className="text-white font-black text-sm font-mono">TT</span>
          </div>
          <span className="font-black text-xl tracking-tight">TechTangle</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <h1 className="text-3xl font-black tracking-tight mb-1">Welcome back</h1>
          <p className="text-slate-500 mb-6">Sign in to continue your puzzle streak.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="overline block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white"
                placeholder="you@example.com"
                data-testid="login-email-input"
              />
            </div>
            <div>
              <label className="overline block mb-2">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white"
                placeholder="••••••••"
                data-testid="login-password-input"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3" data-testid="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
              data-testid="login-submit-button"
            >
              {loading ? "Signing in…" : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="text-sm text-slate-500 mt-6 text-center">
            New to TechTangle?{" "}
            <Link to="/register" className="text-slate-900 font-semibold underline underline-offset-4" data-testid="login-to-register-link">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
