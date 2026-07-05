import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../../services/supabase";

interface RouteGuardProps {
  allowedRoles: string[];
}

export default function RouteGuard({ allowedRoles }: RouteGuardProps) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (active) {
            setAuthenticated(false);
            setChecking(false);
          }
          return;
        }

        // Try getting role from localStorage or fetch it
        let role = localStorage.getItem("user_role");
        if (!role) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          
          if (profile && profile.role) {
            role = profile.role;
            localStorage.setItem("user_role", profile.role);
          }
        }

        if (active) {
          setUserRole(role);
          setAuthenticated(true);
          setChecking(false);
        }
      } catch {
        if (active) {
          setAuthenticated(false);
          setChecking(false);
        }
      }
    }

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          localStorage.removeItem("user_role");
          if (active) {
            setAuthenticated(false);
            setUserRole(null);
            setChecking(false);
          }
        } else if (session) {
          checkAuth();
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-nav flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole && !allowedRoles.includes(userRole as string)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
