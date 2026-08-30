import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "../../services/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess("Password updated successfully!");

      // Sign out to clear the recovery session and force user to log in again
      await supabase.auth.signOut();

      // Redirect back to login with success param after 2 seconds
      setTimeout(() => {
        navigate("/login?reset=success");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The reset link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nav flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-accent/60" />
      <div className="absolute inset-y-0 left-0 w-px bg-white/10" />

      {/* Reset Password Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-dashboard p-8 z-10 transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Ai<span className="text-accent">Valytics</span>
          </h1>
          <p className="text-blue-200 mt-2 text-sm">Create your new password</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 rounded p-3 text-sm mb-6 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-100 rounded p-3 text-sm mb-6 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-blue-200/50"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-blue-200/50"
              placeholder="Confirm new password"
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
              <span>Reset Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
