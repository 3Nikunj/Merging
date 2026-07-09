import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  ClipboardList,
  Code2,
  LayoutDashboard,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import type { JSX } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Tests", path: "/practice-tests" },
  { label: "Company Simulation", path: "/company-simulation" },
  { label: "AI Interview", path: "/ai-interview" },
  { label: "Coding Practice", path: "/coding-practice" },
  { label: "Contests", path: "/contests" },
  { label: "Results", path: "/results" },
  { label: "Profile", path: "/profile" },
];

const icons: Record<string, JSX.Element> = {
  Dashboard: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
  Tests: <ClipboardList className="h-4 w-4" aria-hidden="true" />,
  "Company Simulation": <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />,
  "AI Interview": <Bot className="h-4 w-4" aria-hidden="true" />,
  "Coding Practice": <Code2 className="h-4 w-4" aria-hidden="true" />,
  Contests: <Trophy className="h-4 w-4" aria-hidden="true" />,
  Results: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
  Profile: <User className="h-4 w-4" aria-hidden="true" />,
};

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
                  "group flex items-center gap-4 rounded px-4 py-3 text-base font-semibold transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-inset",
                  isActive ||
                  (item.label === "Tests" &&
                    location.pathname.startsWith("/practice-tests"))
                    ? "border-l-4 border-practice-amber bg-practice-sidebarActive text-white shadow-lg shadow-black/10"
                    : "text-white/70 hover:bg-practice-sidebarActive/50 hover:text-white",
                ].join(" ")
              }
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 text-white/75 transition-all duration-200 group-hover:bg-white/10 group-hover:text-white">
                {icons[item.label]}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <button className="flex w-full items-center justify-center gap-2 rounded bg-practice-amber px-4 py-3 text-sm font-extrabold text-practice-amberDark transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-offset-2 focus-visible:ring-offset-practice-sidebar">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Upgrade to Pro
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
