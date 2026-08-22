import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Search, Settings, FileText, Code, MessageSquare } from "lucide-react";
import { api, UserProfile, NotificationItem } from "../../../services/api";
import { supabase } from "../../../services/supabase";

function Topbar() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

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

    const handleProfileUpdate = () => {
      loadUser();
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      if (!showNotifications) return;
      try {
        setLoadingNotifications(true);
        const data = await api.getNotifications();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    }
    loadNotifications();
  }, [showNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      localStorage.removeItem("user_role");
      setShowSettingsMenu(false);
      setLoggingOut(false);
      navigate("/login");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (query) {
      navigate(`/practice-tests?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/practice-tests");
    }
  };

  const formatNotificationDate = (createdAt?: string) => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "test":
        return <FileText className="h-4 w-4 text-practice-sidebar" />;
      case "coding":
        return <Code className="h-4 w-4 text-practice-amberDark" />;
      case "interview":
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-practice-subdued" />;
    }
  };

  const handleNotificationClick = (href: string) => {
    setShowNotifications(false);
    navigate(href);
  };

  const displayName = userProfile ? userProfile.full_name || userProfile.email : "Loading...";
  const membership = userProfile?.membership_type || "Free Member";
  const avatarUrl = userProfile?.avatar_url;
  const initials = getInitials(userProfile?.full_name || null, userProfile?.email);
  const hasUnreadIndicator = notifications.length > 0;

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[72px] items-center justify-between border-b border-practice-line bg-white px-4 shadow-sm lg:left-[280px] lg:px-6">
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[25rem]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-practice-subdued"
          aria-hidden="true"
        />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded border border-practice-line bg-practice-muted py-2.5 pl-10 pr-4 text-sm text-practice-text outline-none transition placeholder:text-practice-subdued/70 focus:border-practice-ink focus:ring-2 focus:ring-practice-ink/10"
          placeholder="Search tests, topics, or companies..."
          type="search"
        />
      </form>

      <div className="ml-4 flex items-center gap-2 sm:gap-4">
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowSettingsMenu(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded text-practice-subdued transition hover:bg-practice-muted hover:text-practice-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber"
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={showNotifications}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {hasUnreadIndicator && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-practice-error" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded border border-practice-line bg-white shadow-lg">
              <div className="border-b border-practice-muted px-4 py-3">
                <h3 className="text-sm font-extrabold text-practice-ink">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="flex items-center justify-center px-4 py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-practice-muted border-t-practice-sidebar" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="mx-auto mb-2 h-8 w-8 text-practice-subdued/40" />
                    <p className="text-xs font-medium text-practice-subdued">No notifications yet</p>
                    <p className="text-[10px] text-practice-subdued/70 mt-1">
                      Complete tests, coding challenges, or interviews to see updates here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-practice-muted">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          onClick={() => handleNotificationClick(n.href)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-practice-muted/40"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-practice-muted">
                            {getNotificationIcon(n.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-practice-ink">{n.title}</p>
                            <p className="mt-0.5 truncate text-[11px] text-practice-subdued">{n.message}</p>
                            {n.createdAt && (
                              <p className="mt-1 text-[10px] font-semibold text-practice-subdued/70">
                                {formatNotificationDate(n.createdAt)}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={settingsRef}>
          <button
            className="flex h-10 w-10 items-center justify-center rounded text-practice-subdued transition hover:bg-practice-muted hover:text-practice-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber"
            aria-label="Settings"
            aria-haspopup="true"
            aria-expanded={showSettingsMenu}
            onClick={() => {
              setShowSettingsMenu((prev) => !prev);
              setShowNotifications(false);
            }}
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </button>

          {showSettingsMenu && (
            <div className="absolute right-0 top-12 z-40 w-44 overflow-hidden rounded border border-practice-line bg-white shadow-lg">
              <button
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-practice-error transition hover:bg-practice-muted disabled:opacity-60"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </div>

        <div className="mx-1 hidden h-8 w-px bg-practice-line sm:block" />
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-extrabold leading-tight text-practice-ink">{displayName}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-practice-subdued">
              {membership}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-practice-line bg-practice-muted text-sm font-extrabold text-practice-ink">
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
