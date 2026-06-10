import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Registration failed");
      return;
    }
    navigate("/dashboard");
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
          <h1 className="text-3xl font-black tracking-tight mb-1">Create account</h1>
          <p className="text-slate-500 mb-6">Start untangling CS concepts in under a minute.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="overline block mb-2">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white"
                placeholder="Ada Lovelace"
                data-testid="register-name-input"
              />
            </div>
            <div>
              <label className="overline block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white"
                placeholder="you@example.com"
                data-testid="register-email-input"
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
                placeholder="At least 6 characters"
                data-testid="register-password-input"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3" data-testid="register-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
              data-testid="register-submit-button"
            >
              {loading ? "Creating account…" : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="text-sm text-slate-500 mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-slate-900 font-semibold underline underline-offset-4" data-testid="register-to-login-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
