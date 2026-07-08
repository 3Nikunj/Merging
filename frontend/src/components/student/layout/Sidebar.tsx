import { NavLink, useLocation } from "react-router-dom";

import { JSX } from "react";

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
  Dashboard: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Tests: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  "Company Simulation": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  "AI Interview": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  "Coding Practice": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  Contests: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm-2 2h4M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
    </svg>
  ),
  Results: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Profile: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
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
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-practice-amber px-4 py-3 text-sm font-extrabold text-practice-amberDark transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-offset-2 focus-visible:ring-offset-practice-sidebar">
            <span className="text-base">*</span>
            Upgrade to Pro
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
