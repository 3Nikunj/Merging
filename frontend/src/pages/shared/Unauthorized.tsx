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
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-red-500/10 opacity-10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-dashboard p-8 z-10">
        <div className="text-6xl mb-4 animate-bounce">🚫</div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Access Denied
        </h1>
        <p className="text-blue-200 mt-2 text-sm">
          You do not have the required permissions to view this page.
        </p>

        <button
          onClick={handleBack}
          className="mt-8 px-6 py-3 bg-accent hover:bg-accent/90 text-nav font-bold rounded-xl transition-all duration-200 shadow-buddy inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
