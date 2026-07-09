import { ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  const handleBack = () => {
    const role = localStorage.getItem("user_role");
    if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/practice-tests");
    }
  };

  return (
    <div className="min-h-screen bg-nav flex items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute inset-x-0 top-0 h-px bg-accent/60" />
      <div className="absolute inset-y-0 left-0 w-px bg-white/10" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-dashboard p-8 z-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded border border-white/20 text-accent">
          <ShieldX className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Access Denied
        </h1>
        <p className="text-blue-200 mt-2 text-sm">
          You do not have the required permissions to view this page.
        </p>

        <button
          onClick={handleBack}
          className="mt-8 px-6 py-3 bg-accent hover:bg-accent/90 text-nav font-bold rounded transition-all duration-200 shadow-buddy inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-nav"
        >
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
