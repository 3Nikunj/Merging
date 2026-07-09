import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { supabase } from "../../services/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data?.user) {
        // Query the profile to get the user's role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Could not retrieve user profile role.");
        }

        const role = profile.role;
        localStorage.setItem("user_role", role);

        // Redirect based on role
        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/practice-tests");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nav flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-accent/60" />
      <div className="absolute inset-y-0 left-0 w-px bg-white/10" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-dashboard p-8 z-10 transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Ai<span className="text-accent">Valytics</span>
          </h1>
          <p className="text-blue-200 mt-2 text-sm">Sign in to your learning dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 rounded p-3 text-sm mb-6 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-blue-200/50"
              placeholder="e.g. name@domain.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-blue-200/50"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-nav font-bold rounded transition-all duration-200 flex items-center justify-center gap-2 shadow-buddy hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-nav border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-blue-200/70">
            Forgot password? Please contact your platform administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
