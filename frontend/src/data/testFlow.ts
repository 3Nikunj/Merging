import { useEffect, useState, useRef } from "react";
import { Bell, Search, Settings, LogOut } from "lucide-react";

// ---- Mocked services (in your real app these come from your api.ts / supabase.ts) ----
const mockApi = {
  getProfile: () =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            profile: {
              full_name: "Aditi Sharma",
              email: "aditi.sharma@example.com",
              membership_type: "Gold Member",
              avatar_url: null,
            },
          }),
        400
      )
    ),
};

const mockSupabase = {
  auth: {
    signOut: () => new Promise((resolve) => setTimeout(resolve, 300)),
  },
};

function LoginScreen({ onBackToApp }) {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-extrabold text-slate-900">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-500">
          You&apos;ve been logged out. Sign in to continue.
        </p>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Email
          </label>
          <input
            type="email"
            disabled
            placeholder="you@example.com"
            className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400"
          />
        </div>
        <div className="mb-6">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Password
          </label>
          <input
            type="password"
            disabled
            placeholder="••••••••"
            className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400"
          />
        </div>
        <button
          disabled
          className="mb-4 w-full rounded bg-slate-900 py-2.5 text-sm font-bold text-white opacity-60"
        >
          Log in
        </button>
        <button
          onClick={onBackToApp}
          className="w-full text-center text-xs font-semibold text-amber-600 underline underline-offset-2"
        >
          ← Back to demo (simulate re-login)
        </button>
      </div>
    </div>
  );
}

function Topbar({ onLogoutNavigate }) {
  const [userProfile, setUserProfile] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await mockApi.getProfile();
        setUserProfile(data.profile);
      } catch (err) {
        console.error("Failed to load user profile in Topbar", err);
      }
    }
    loadUser();
    const handleProfileUpdate = () => loadUser();
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name, email) => {
    const val = name || email;
    if (!val) return "U";
    return val
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await mockSupabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      // In your real app: localStorage.removeItem("user_role");
      setShowSettingsMenu(false);
      setLoggingOut(false);
      onLogoutNavigate();
    }
  };

  const displayName = userProfile ? userProfile.full_name || userProfile.email : "Loading...";
  const membership = userProfile?.membership_type || "Gold Member";
  const avatarUrl = userProfile?.avatar_url;
  const initials = getInitials(userProfile?.full_name || null, userProfile?.email);

  return (
    <header className="relative flex h-[72px] w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-6">
      <div className="relative w-full max-w-[25rem]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          className="w-full rounded border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          placeholder="Search tests, topics, or companies..."
          type="search"
        />
      </div>
      <div className="ml-4 flex items-center gap-2 sm:gap-4">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded text-slate-400 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="relative" ref={settingsRef}>
          <button
            className="flex h-10 w-10 items-center justify-center rounded text-slate-400 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Settings"
            aria-haspopup="true"
            aria-expanded={showSettingsMenu}
            onClick={() => setShowSettingsMenu((prev) => !prev)}
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </button>

          {showSettingsMenu && (
            <div className="absolute right-0 top-12 z-40 w-44 overflow-hidden rounded border border-slate-200 bg-white shadow-lg">
              <button
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-slate-50 disabled:opacity-60"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </div>

        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-extrabold leading-tight text-slate-900">{displayName}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {membership}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-900">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(true);

  return (
    <div className="w-full">
      {loggedIn ? (
        <div>
          <Topbar onLogoutNavigate={() => setLoggedIn(false)} />
          <div className="flex min-h-[350px] items-center justify-center bg-slate-50 p-8 text-center text-sm text-slate-400">
            Page content goes here.
            <br />
            Click the settings gear (top right) to see the Logout option.
          </div>
        </div>
      ) : (
        <LoginScreen onBackToApp={() => setLoggedIn(true)} />
      )}
    </div>
  );
}
