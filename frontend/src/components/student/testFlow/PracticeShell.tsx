import { Link, NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

interface PracticeShellProps {
  children: ReactNode;
  title?: string;
  compact?: boolean;
}

const links = [
  { label: "Dashboard", path: "/dashboard", icon: "D" },
  { label: "Tests", path: "/practice-tests", icon: "T" },
  { label: "Company Simulation", path: "/company-simulation", icon: "C" },
  { label: "AI Interview", path: "/ai-interview", icon: "A" },
  { label: "Coding Practice", path: "/coding-practice", icon: "</>" },
  { label: "Contests", path: "/contests", icon: "#" },
  { label: "Results", path: "/results", icon: "%" },
  { label: "Profile", path: "/profile", icon: "P" },
];

function PracticeShell({ children, title = "AiValytics", compact = false }: PracticeShellProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-practice-background text-practice-text">
      <aside className="hidden h-screen w-[280px] flex-col bg-practice-sidebar text-white lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:flex">
        <div className="p-6">
          <Link to="/practice-tests" className="block">
            <h1 className="text-3xl font-extrabold text-practice-amber">AiValytics</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/50">
              Elite Career Portal
            </p>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.path}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-4 py-3 text-sm font-semibold transition",
                  isActive ||
                  (link.label === "Tests" &&
                    location.pathname.startsWith("/practice-tests"))
                    ? "border-l-4 border-practice-amber bg-white/10 text-practice-amber"
                    : "text-white/65 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              <span className="flex h-5 min-w-5 items-center justify-center text-[10px] font-black">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6">
          <button className="w-full rounded-lg bg-practice-amber px-4 py-3 text-sm font-extrabold text-practice-ink">
            Upgrade to Pro
          </button>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-[72px] items-center justify-between border-b border-practice-line bg-white px-4 lg:left-[280px] lg:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-practice-subdued">
            PlacementPrep
          </p>
          <h2 className="text-lg font-extrabold text-practice-ink">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="hidden w-64 rounded-full border border-practice-line bg-practice-muted px-4 py-2 text-sm outline-none focus:border-practice-ink sm:block"
            placeholder="Search topics..."
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-practice-muted text-sm font-bold">
            AR
          </div>
        </div>
      </header>

      <main
        className={[
          "min-h-screen px-4 pt-[96px] sm:px-6 lg:ml-[280px]",
          compact ? "pb-6" : "pb-28",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}

export default PracticeShell;
