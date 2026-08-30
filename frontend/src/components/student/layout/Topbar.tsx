import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Search, Settings } from "lucide-react";
import { api, UserProfile } from "../../../services/api";
import { supabase } from "../../../services/supabase";

const searchItems = [
  // Practice Tests
  { id: "dsa-core", name: "Data Structures & Algorithms", category: "Practice Test", path: "/practice-tests" },
  { id: "os-fundamentals", name: "Operating Systems Fundamentals", category: "Practice Test", path: "/practice-tests" },
  { id: "probability-statistics", name: "Probability & Statistics", category: "Practice Test", path: "/practice-tests" },
  { id: "dbms-interview", name: "Database Management Essentials", category: "Practice Test", path: "/practice-tests" },
  // Coding Problems
  { id: "001", name: "Two Sum", category: "Coding Practice", path: "/coding-practice/problems/001" },
  { id: "002", name: "Reverse Linked List", category: "Coding Practice", path: "/coding-practice/problems/002" },
  { id: "003", name: "Valid Parentheses", category: "Coding Practice", path: "/coding-practice/problems/003" },
  { id: "004", name: "Merge k Sorted Lists", category: "Coding Practice", path: "/coding-practice/problems/004" },
  { id: "005", name: "Longest Substring Without Repeating Characters", category: "Coding Practice", path: "/coding-practice/problems/005" },
  { id: "006", name: "Median of Two Sorted Arrays", category: "Coding Practice", path: "/coding-practice/problems/006" },
  { id: "007", name: "Container With Most Water", category: "Coding Practice", path: "/coding-practice/problems/007" },
  { id: "008", name: "3Sum", category: "Coding Practice", path: "/coding-practice/problems/008" },
  { id: "009", name: "Letter Combinations of a Phone Number", category: "Coding Practice", path: "/coding-practice/problems/009" },
  // Companies
  { id: "capgemini", name: "Capgemini Simulation", category: "Company Simulation", path: "/company-simulation?company_id=capgemini" },
  { id: "tcs", name: "TCS (Ninja/Digital) Simulation", category: "Company Simulation", path: "/company-simulation?company_id=tcs" },
  { id: "accenture", name: "Accenture Simulation", category: "Company Simulation", path: "/company-simulation?company_id=accenture" },
  { id: "infosys", name: "Infosys Simulation", category: "Company Simulation", path: "/company-simulation?company_id=infosys" }
];

function Topbar() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    let channel: any;

    async function initializeNotifications() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const currentUserId = session.user.id;

        // Fetch initial notifications list
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false });

        if (data) {
          setNotifications(data);
        }

        // Subscribe to changes
        channel = supabase
          .channel(`user-notifications-${currentUserId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${currentUserId}`
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                setNotifications((prev) => [payload.new, ...prev]);
              } else if (payload.eventType === "UPDATE") {
                setNotifications((prev) =>
                  prev.map((n) => (n.id === payload.new.id ? payload.new : n))
                );
              } else if (payload.eventType === "DELETE") {
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== payload.old.id)
                );
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Error setting up notifications realtime", err);
      }
    }

    initializeNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
    } catch (err) {
      console.error("Error marking notification read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
    } catch (err) {
      console.error("Error marking all notifications read", err);
    }
  };

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

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSearch(false);
      }
      if (!target.closest(".notifications-container")) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
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

  const filteredSearchItems = searchQuery.trim() === ""
    ? []
    : searchItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-[72px] items-center justify-between border-b border-practice-line bg-white px-4 shadow-sm lg:left-[280px] lg:px-6">
      <div className="relative w-full max-w-[25rem] search-container">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-practice-subdued" aria-hidden="true" />
        <input
          className="w-full rounded border border-practice-line bg-practice-muted py-2.5 pl-10 pr-4 text-sm text-practice-text outline-none transition placeholder:text-practice-subdued/70 focus:border-practice-ink focus:ring-2 focus:ring-practice-ink/10"
          placeholder="Search tests, topics, or companies..."
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearch(true);
          }}
          onFocus={() => setShowSearch(true)}
        />

        {showSearch && searchQuery.trim() !== "" && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-[300px] overflow-y-auto rounded-lg border border-practice-line bg-white p-2 shadow-dashboard z-50">
            {filteredSearchItems.length > 0 ? (
              <div className="space-y-1">
                {filteredSearchItems.map((item) => (
                  <button
                    key={`${item.category}-${item.id}`}
                    onClick={() => {
                      navigate(item.path);
                      setSearchQuery("");
                      setShowSearch(false);
                    }}
                    className="flex w-full flex-col rounded p-2 text-left hover:bg-practice-muted transition"
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-practice-sidebar/60">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-practice-ink mt-0.5">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-practice-subdued">
                No matching results found
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ml-4 flex items-center gap-2 sm:gap-4">
        <div className="relative notifications-container">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded text-practice-subdued transition hover:bg-practice-muted hover:text-practice-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-practice-error" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-practice-line bg-white p-4 shadow-dashboard z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-practice-muted pb-2">
                <span className="text-sm font-black text-practice-ink">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] font-extrabold uppercase tracking-wider text-practice-sidebar hover:text-practice-sidebarActive transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`cursor-pointer rounded-lg p-2.5 text-left border transition ${n.read ? 'border-transparent hover:bg-practice-muted/40' : 'border-practice-amber/20 bg-practice-amber/5 hover:bg-practice-amber/10'}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-practice-ink">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-practice-amber shrink-0" />}
                      </div>
                      <p className="text-[11px] text-practice-subdued mt-0.5 leading-normal">{n.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-practice-subdued py-4">No notifications yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          to="/profile"
          className="flex h-10 w-10 items-center justify-center rounded text-practice-subdued transition hover:bg-practice-muted hover:text-practice-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Link>

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
