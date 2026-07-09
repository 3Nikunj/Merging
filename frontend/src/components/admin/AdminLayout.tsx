import {
  Boxes,
  Building2,
  ChevronRight,
  ClipboardList,
  Code2,
  Database,
  Gauge,
  Layers3,
  LogOut,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "../../styles/admin-styles.css";

type AdminLink = {
  to: string;
  label: string;
  description: string;
  exact?: boolean;
  icon: LucideIcon;
};

const links: AdminLink[] = [
  {
    to: "/admin",
    label: "Overview",
    description: "Health, volume, and readiness",
    exact: true,
    icon: Gauge,
  },
  {
    to: "/admin/taxonomy",
    label: "Taxonomy",
    description: "Subjects, topics, subtopics",
    icon: Layers3,
  },
  {
    to: "/admin/batches",
    label: "Batches",
    description: "Colleges, cohorts, students",
    icon: Building2,
  },
  {
    to: "/admin/questions",
    label: "Question Bank",
    description: "MCQ and coding content",
    icon: ClipboardList,
  },
  {
    to: "/admin/tests",
    label: "Tests",
    description: "Assessment composition",
    icon: Boxes,
  },
  {
    to: "/admin/programming-problems",
    label: "Coding Problems",
    description: "Judge metadata and templates",
    icon: Code2,
  },
];

function getCurrentSection(pathname: string) {
  return (
    links.find((link) =>
      link.exact ? pathname === link.to : pathname.startsWith(link.to),
    ) ?? links[0]
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentSection = getCurrentSection(location.pathname);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  return (
    <div className="admin-theme">
      <div className="app-shell">
        <aside className="sidebar">
          <div>
            <div className="brand">
              <div className="brand-mark">Ai</div>
              <div>
                <h1>AiValytics</h1>
                <p>Admin Command</p>
              </div>
            </div>

            <div className="admin-health-card" aria-label="Admin workspace status">
              <div>
                <span>Workspace</span>
                <strong>Production CMS</strong>
              </div>
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>

            <nav className="nav" aria-label="Admin navigation">
              {links.map((link) => {
                const Icon = link.icon;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.exact}
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    <span className="nav-icon">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="nav-copy">
                      <strong>{link.label}</strong>
                      <small>{link.description}</small>
                    </span>
                    <ChevronRight className="nav-arrow h-4 w-4" aria-hidden="true" />
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="sidebar-footer">
            <div className="signed-in-card">
              <span>Signed in as</span>
              <strong>Administrator</strong>
            </div>
            <button onClick={handleLogout} className="logout-button" type="button">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </aside>

        <div className="admin-main-shell">
          <header className="admin-topbar">
            <div>
              <p className="admin-kicker">Admin Portal</p>
              <h1>{currentSection.label}</h1>
            </div>
            <div className="admin-topbar-tools">
              <label className="admin-search">
                <Search className="h-4 w-4" aria-hidden="true" />
                <input aria-label="Search admin workspace" placeholder="Search workspace..." />
              </label>
              <div className="admin-system-pill">
                <Database className="h-4 w-4" aria-hidden="true" />
                Supabase live
              </div>
            </div>
          </header>

          <main className="content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
