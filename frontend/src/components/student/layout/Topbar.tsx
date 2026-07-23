import { useEffect, useState } from "react";
import { Bell, Search, Settings } from "lucide-react";
import { api, UserProfile } from "../../../services/api";

function Topbar() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await api.getProfile();
        setUserProfile(data.profile);
      } catch (err) {
        console.error("Failed to load user profile in Topbar", err);
      }
    }
    loadUser();

    // Listen to custom profile update event for instant header synchronization
    const handleProfileUpdate = () => {
      loadUser();
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  const getInitials = (name: string | null, email: string | undefined) => {
    const val = name || email;
    if (!val) return "U";
    return val
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const displayName = userProfile ? (userProfile.full_name || userProfile.email) : "Loading...";
  const membership = userProfile?.membership_type || "Gold Member";
  const avatarUrl = userProfile?.avatar_url;
  const initials = getInitials(userProfile?.full_name || null, userProfile?.email);

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[72px] items-center justify-between border-b border-practice-line bg-white px-4 shadow-sm lg:left-[280px] lg:px-6">
      <div className="relative w-full max-w-[25rem]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-practice-subdued" aria-hidden="true" />
        <input
          className="w-full rounded border border-practice-line bg-practice-muted py-2.5 pl-10 pr-4 text-sm text-practice-text outline-none transition placeholder:text-practice-subdued/70 focus:border-practice-ink focus:ring-2 focus:ring-practice-ink/10"
          placeholder="Search tests, topics, or companies..."
          type="search"
        />
      </div>

      <div className="ml-4 flex items-center gap-2 sm:gap-4">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded text-practice-subdued transition hover:bg-practice-muted hover:text-practice-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-practice-error" />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded text-practice-subdued transition hover:bg-practice-muted hover:text-practice-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="mx-1 hidden h-8 w-px bg-practice-line sm:block" />
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-extrabold leading-tight text-practice-ink">
              {displayName}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-practice-subdued">
              {membership}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded border border-practice-line bg-practice-muted overflow-hidden text-sm font-extrabold text-practice-ink">
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

export default Topbar;
