import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./services/supabase";
import RouteGuard from "./components/shared/RouteGuard";
import AdminLayout from "./components/admin/AdminLayout";

// Shared Pages
import Login from "./pages/shared/Login";
import Unauthorized from "./pages/shared/Unauthorized";
import ResetPassword from "./pages/shared/ResetPassword";

// Student Pages
import CodingArenaPage from "./pages/student/CodingArena/CodingArenaPage";
import CodingProblemsListPage from "./pages/student/CodingArena/CodingProblemsListPage";
import LiveTestPage from "./pages/student/LiveTest/LiveTestPage";
import PlaceholderPage from "./pages/student/PlaceholderPage";
import ResultsPage from "./pages/student/Results/ResultsPage";
import TestInstructionsPage from "./pages/student/TestInstructions/TestInstructionsPage";
import TestSelectionPage from "./pages/student/TestSelection/TestSelectionPage";
import AiInterviewDashboard from "./pages/student/AiInterview/AiInterviewDashboard";
import AiInterviewRoom from "./pages/student/AiInterview/AiInterviewRoom";
import AiInterviewReport from "./pages/student/AiInterview/AiInterviewReport";
import CompanySimulationPage from "./pages/student/CompanySimulation/CompanySimulationPage";
import ProfilePage from "./pages/student/Profile/ProfilePage";
import DashboardPage from "./pages/student/Dashboard/DashboardPage";

// Admin Pages
import { OverviewPage } from "./pages/admin/OverviewPage";
import { TaxonomyPage } from "./pages/admin/TaxonomyPage";
import { BatchesPage } from "./pages/admin/BatchesPage";
import { QuestionBankPage } from "./pages/admin/QuestionBankPage";
import { TestsPage } from "./pages/admin/TestsPage";
import { ProgrammingProblemsPage } from "./pages/admin/ProgrammingProblemsPage";

function RootRedirect() {
  const role = localStorage.getItem("user_role");
  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/practice-tests" replace />;
}

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Student Guarded Routes */}
      <Route element={<RouteGuard allowedRoles={["student"]} />}>
        <Route path="/practice-tests" element={<TestSelectionPage />} />
        <Route path="/practice-tests/selection" element={<TestSelectionPage />} />
        <Route path="/practice-tests/instructions" element={<TestInstructionsPage />} />
        <Route path="/practice-tests/live" element={<LiveTestPage />} />
        <Route path="/practice-tests/results" element={<ResultsPage />} />
        <Route path="/coding-practice" element={<CodingProblemsListPage />} />
        <Route path="/coding-practice/problems/:problemId" element={<CodingArenaPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/company-simulation"
          element={<CompanySimulationPage />}
        />
        <Route path="/ai-interview" element={<AiInterviewDashboard />} />
        <Route path="/ai-interview/live/:sessionId" element={<AiInterviewRoom />} />
        <Route path="/ai-interview/report/:sessionId" element={<AiInterviewReport />} />
        <Route path="/contests" element={<PlaceholderPage title="Contests" />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Guarded Routes */}
      <Route element={<RouteGuard allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<OverviewPage />} />
          <Route path="/admin/taxonomy" element={<TaxonomyPage />} />
          <Route path="/admin/batches" element={<BatchesPage />} />
          <Route path="/admin/batches/:collegeId" element={<BatchesPage />} />
          <Route path="/admin/questions" element={<QuestionBankPage />} />
          <Route path="/admin/tests" element={<TestsPage />} />
          <Route path="/admin/programming-problems" element={<ProgrammingProblemsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
