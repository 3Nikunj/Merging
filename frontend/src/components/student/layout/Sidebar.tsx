import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: "D" },
  { label: "Tests", path: "/practice-tests", icon: "T" },
  { label: "Company Simulation", path: "/company-simulation", icon: "C" },
  { label: "AI Interview", path: "/ai-interview", icon: "A" },
  { label: "Coding Practice", path: "/coding-practice", icon: "</>" },
  { label: "Contests", path: "/contests", icon: "#" },
  { label: "Results", path: "/results", icon: "%" },
  { label: "Profile", path: "/profile", icon: "P" },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden h-screen w-[280px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-practice-sidebar text-white lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex">
      <div className="flex min-h-full flex-col p-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-practice-amber text-practice-amberDark shadow-sm">
            <span className="text-lg font-black">Ai</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-none tracking-tight">
              AiValytics
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
              Elite Career Portal
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-4 rounded px-4 py-3 text-base font-semibold transition active:scale-[0.99]",
                  isActive ||
                  (item.label === "Tests" &&
                    location.pathname.startsWith("/practice-tests"))
                    ? "border-l-4 border-practice-amber bg-practice-sidebarActive text-white shadow-lg shadow-black/10"
                    : "text-white/70 hover:bg-practice-sidebarActive/50 hover:text-white",
                ].join(" ")
              }
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 text-[11px] font-black">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-practice-amber px-4 py-3 text-sm font-extrabold text-practice-amberDark transition hover:opacity-90">
            <span className="text-base">*</span>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
