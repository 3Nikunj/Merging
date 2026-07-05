import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "../../styles/admin-styles.css";

const links = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/taxonomy", label: "Taxonomy" },
  { to: "/admin/batches", label: "Batches" },
  { to: "/admin/questions", label: "Question Bank" },
  { to: "/admin/tests", label: "Tests" },
  { to: "/admin/programming-problems", label: "Coding Problems" },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  return (
    <div className="admin-theme">
      <div className="app-shell">
        <aside className="sidebar flex flex-col justify-between h-full min-h-screen">
          <div>
            <div className="brand mb-8">
              <h1 className="text-white font-extrabold text-2xl tracking-tight">
                Ai<span className="text-accent">Valytics</span>
              </h1>
              <p className="text-xs uppercase tracking-wider text-accent font-semibold mt-1">
                Admin CMS
              </p>
            </div>
            <nav className="nav flex flex-col gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.exact}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t border-white/10 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </aside>
        <main className="content flex-1 overflow-auto bg-[#f4efe3] min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
