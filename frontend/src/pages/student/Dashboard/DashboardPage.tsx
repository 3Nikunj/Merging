import { useEffect, useState } from "react";
import AppLayout from "../../../components/student/layout/AppLayout";
import { 
  api, 
  UserProfileResponse, 
  DashboardStats, 
  Recommendation, 
  WeakArea 
} from "../../../services/api";
import { 
  Award, 
  Terminal, 
  UserCheck, 
  Sparkles, 
  ArrowUpRight, 
  Activity, 
  Flame, 
  TrendingUp,
  Volume2,
  Mic,
  BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [profData, statsData, recsData, weakData] = await Promise.all([
          api.getProfile(),
          api.getDashboardStats(),
          api.getRecommendations(),
          api.getWeakAreas(),
        ]);
        setProfile(profData);
        setStats(statsData);
        setRecommendations(recsData.recommendations || []);
        setWeakAreas(weakData.weakAreas || []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const getWelcomeName = () => {
    if (profile?.profile.full_name) {
      return profile.profile.full_name.split(" ")[0];
    }
    return "Student";
  };

  if (loading || !stats) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-44 rounded-2xl bg-white shadow-dashboard"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="h-48 rounded-2xl bg-white shadow-dashboard col-span-1"></div>
            <div className="h-48 rounded-2xl bg-white shadow-dashboard col-span-1"></div>
            <div className="h-48 rounded-2xl bg-white shadow-dashboard col-span-1"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-80 rounded-2xl bg-white shadow-dashboard"></div>
            <div className="h-80 rounded-2xl bg-white shadow-dashboard"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Calculate generic placement readiness rating
  const overallReadiness = Math.round(
    (stats.averageTestScore * 0.4) + (stats.codingSuccessRate * 0.4) + ((stats.interviewAverageScore * 10) * 0.2)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Visual Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-practice-line bg-gradient-to-r from-practice-sidebar via-practice-sidebarActive to-practice-sidebar p-6 text-white shadow-dashboard sm:p-8">
          <div className="relative z-10 max-w-lg space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-practice-amber/20 px-3 py-1 text-xs font-bold text-practice-amber border border-practice-amber/30">
              <Flame className="h-3 w-3" />
              Sprinting to Placements
            </span>
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              Welcome back, {getWelcomeName()}!
            </h1>
            <p className="text-sm font-medium text-practice-muted/80">
              You are currently <span className="font-extrabold text-practice-amber">{overallReadiness}% Ready</span> for your recruitment placement cycles. Let's finish your recommended sprints today!
            </p>
          </div>
          
          {/* Circular overall progress watermark graphic */}
          <div className="absolute -bottom-10 -right-10 opacity-10 sm:bottom-0 sm:right-0">
            <TrendingUp className="h-48 w-48 text-white" />
          </div>
        </div>

        {/* Dynamic Circular SVG readiness gauge rings */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          
          {/* Ring 1: Aptitude Coverage */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-practice-line bg-white p-6 text-center shadow-dashboard">
            <div className="relative mb-3 flex h-28 w-28 items-center justify-center">
              <svg className="absolute h-full w-full -rotate-90">
                <circle cx="56" cy="56" r="48" className="stroke-practice-muted fill-none stroke-[8]" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  className="stroke-practice-sidebar fill-none stroke-[8] transition-all duration-1000 ease-out" 
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - stats.averageTestScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-2xl font-extrabold text-practice-sidebar">{stats.averageTestScore}%</span>
                <p className="text-[10px] font-bold text-practice-subdued uppercase">Accuracy</p>
              </div>
            </div>
            <Award className="h-5 w-5 text-practice-sidebar mb-1" />
            <h3 className="text-sm font-bold text-practice-ink">Aptitude Coverage</h3>
            <p className="text-xs text-practice-subdued mt-1">Completed {stats.testsCompleted} practice tests</p>
          </div>

          {/* Ring 2: Coding Proficiency */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-practice-line bg-white p-6 text-center shadow-dashboard">
            <div className="relative mb-3 flex h-28 w-28 items-center justify-center">
              <svg className="absolute h-full w-full -rotate-90">
                <circle cx="56" cy="56" r="48" className="stroke-practice-muted fill-none stroke-[8]" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  className="stroke-practice-amber fill-none stroke-[8] transition-all duration-1000 ease-out" 
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - stats.codingSuccessRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-2xl font-extrabold text-practice-sidebar">{stats.codingSuccessRate}%</span>
                <p className="text-[10px] font-bold text-practice-subdued uppercase">Success</p>
              </div>
            </div>
            <Terminal className="h-5 w-5 text-practice-amberDark mb-1" />
            <h3 className="text-sm font-bold text-practice-ink">Coding Arena Track</h3>
            <p className="text-xs text-practice-subdued mt-1">{stats.codingTotalSubmissions} total arena submissions</p>
          </div>

          {/* Ring 3: AI Interview Score */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-practice-line bg-white p-6 text-center shadow-dashboard">
            <div className="relative mb-3 flex h-28 w-28 items-center justify-center">
              <svg className="absolute h-full w-full -rotate-90">
                <circle cx="56" cy="56" r="48" className="stroke-practice-muted fill-none stroke-[8]" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  className="stroke-green-500 fill-none stroke-[8] transition-all duration-1000 ease-out" 
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - (stats.interviewAverageScore * 10) / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-2xl font-extrabold text-practice-sidebar">{stats.interviewAverageScore}/10</span>
                <p className="text-[10px] font-bold text-practice-subdued uppercase">Rating</p>
              </div>
            </div>
            <UserCheck className="h-5 w-5 text-green-500 mb-1" />
            <h3 className="text-sm font-bold text-practice-ink">Mock Interview Quality</h3>
            <p className="text-xs text-practice-subdued mt-1">{stats.interviewCompletedCount} completed sessions</p>
          </div>

        </div>

        {/* Section: Dynamic charts and recommendations split */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Custom Subject Mastery Bar Chart */}
          <div className="rounded-2xl border border-practice-line bg-white p-6 shadow-dashboard space-y-6">
            <div className="border-b border-practice-muted pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-practice-ink">Subject Mastery</h3>
                <p className="text-xs text-practice-subdued">Progress across major placement topics</p>
              </div>
              <Activity className="h-5 w-5 text-practice-sidebar" />
            </div>

            <div className="space-y-4">
              {/* Quant */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-practice-text">Quantitative Aptitude</span>
                  <span className="text-practice-sidebar">
                    {stats.subjectMastery?.["aptitude"] !== undefined ? `${Math.round(stats.subjectMastery["aptitude"])}%` : "75%"}
                  </span>
                </div>
                <div className="h-3 w-full bg-practice-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-practice-amber rounded-full" 
                    style={{ width: `${stats.subjectMastery?.["aptitude"] !== undefined ? stats.subjectMastery["aptitude"] : 75}%` }} 
                  />
                </div>
              </div>

              {/* Logical */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-practice-text">Logical Reasoning</span>
                  <span className="text-practice-sidebar">
                    {stats.subjectMastery?.["reasoning"] !== undefined ? `${Math.round(stats.subjectMastery["reasoning"])}%` : "40%"}
                  </span>
                </div>
                <div className="h-3 w-full bg-practice-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-practice-sidebarActive rounded-full" 
                    style={{ width: `${stats.subjectMastery?.["reasoning"] !== undefined ? stats.subjectMastery["reasoning"] : 40}%` }} 
                  />
                </div>
              </div>

              {/* CS Foundations */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-practice-text">Computer Science Foundations</span>
                  <span className="text-practice-sidebar">
                    {stats.subjectMastery?.["verbal"] !== undefined ? `${Math.round(stats.subjectMastery["verbal"])}%` : "85%"}
                  </span>
                </div>
                <div className="h-3 w-full bg-practice-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-practice-sidebar rounded-full" 
                    style={{ width: `${stats.subjectMastery?.["verbal"] !== undefined ? stats.subjectMastery["verbal"] : 85}%` }} 
                  />
                </div>
              </div>

              {/* Coding */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-practice-text">Data Structures & Core Coding</span>
                  <span className="text-practice-sidebar">
                    {stats.subjectMastery?.["coding"] !== undefined ? `${Math.round(stats.subjectMastery["coding"])}%` : "55%"}
                  </span>
                </div>
                <div className="h-3 w-full bg-practice-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${stats.subjectMastery?.["coding"] !== undefined ? stats.subjectMastery["coding"] : 55}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Segmented Debugging Status Distribution Bar */}
            <div className="pt-4 border-t border-practice-muted">
              <h4 className="text-xs font-bold uppercase tracking-wider text-practice-subdued mb-2">
                Coding Submission Debug Stats
              </h4>
              <div className="flex h-4 w-full rounded-full overflow-hidden bg-practice-muted">
                <div 
                  className="bg-green-500 transition-all duration-500" 
                  style={{ width: `${stats.codingSuccessRate}%` }} 
                  title={`Accepted: ${stats.codingSuccessRate}%`}
                />
                <div 
                  className="bg-red-500 transition-all duration-500" 
                  style={{ width: `${100 - stats.codingSuccessRate}%` }}
                  title={`Compile/Runtime errors: ${100 - stats.codingSuccessRate}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-practice-subdued mt-1">
                <span>Accepted ({stats.codingSuccessRate}%)</span>
                <span>Attempts / Failures ({Math.round(100 - stats.codingSuccessRate)}%)</span>
              </div>
            </div>

          </div>

          {/* AI Recommended Priority Sprints Card */}
          <div className="rounded-2xl border border-practice-line bg-white p-6 shadow-dashboard space-y-4">
            <div className="border-b border-practice-muted pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-practice-ink">AI Priority Sprints</h3>
                <p className="text-xs text-practice-subdued">Target assessments derived from accuracy</p>
              </div>
              <Sparkles className="h-5 w-5 text-practice-amberDark" />
            </div>

            <div className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-practice-line/30 bg-practice-surface transition-all hover:bg-practice-muted/40"
                  >
                    <div className="space-y-1">
                      <span className="inline-flex rounded bg-practice-amber/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-practice-amberDark border border-practice-amber/20">
                        {rec.label}
                      </span>
                      <h4 className="text-sm font-bold text-practice-ink">{rec.title}</h4>
                      <p className="text-xs text-practice-subdued leading-none">{rec.description}</p>
                    </div>
                    
                    <Link
                      to={rec.title.includes("Interview") || rec.title.includes("Communication") ? "/ai-interview" : "/practice-tests"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-practice-ink text-white hover:bg-practice-sidebar transition-all hover:scale-105"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-practice-subdued">
                  No recommended actions today. Great job!
                </div>
              )}
            </div>

            {/* AI Speech & Communication Articulation Gauge */}
            <div className="pt-2 border-t border-practice-muted flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-practice-subdued">
                  Interview Speech articulators
                </h4>
                <div className="flex gap-4 pt-1">
                  {/* Articulation trait 1 */}
                  <div className="flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5 text-practice-sidebar" />
                    <span className="text-[10px] font-bold text-practice-text">Pacing: Stable</span>
                  </div>
                  {/* Articulation trait 2 */}
                  <div className="flex items-center gap-1">
                    <Mic className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-[10px] font-bold text-practice-text">Grammar: 8.5/10</span>
                  </div>
                </div>
              </div>
              
              {/* Battery level styling representation */}
              <div className="flex gap-0.5 bg-practice-muted p-1 rounded">
                <div className="h-4 w-2 rounded bg-green-500" />
                <div className="h-4 w-2 rounded bg-green-500" />
                <div className="h-4 w-2 rounded bg-green-500" />
                <div className="h-4 w-2 rounded bg-green-500" />
                <div className="h-4 w-2 rounded bg-practice-line" />
              </div>
            </div>

          </div>

        </div>

        {/* Section: Weak Areas List */}
        <div className="rounded-2xl border border-practice-line bg-white p-6 shadow-dashboard space-y-4">
          <div className="border-b border-practice-muted pb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-practice-error" />
            <h3 className="text-base font-bold text-practice-ink">Areas Requiring Extra Focus</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {weakAreas.length > 0 ? (
              weakAreas.map((wa, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border border-red-100 bg-red-50/30 rounded-xl"
                >
                  <div>
                    <h4 className="text-sm font-extrabold text-practice-ink">{wa.topic}</h4>
                    <p className="text-xs text-practice-subdued mt-0.5">Current accuracy level</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-practice-error">{wa.accuracy}%</span>
                    <div className="h-2 w-20 bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full bg-practice-error rounded-full" style={{ width: `${wa.accuracy}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-practice-subdued">You don't have any weak areas. Fantastic job!</p>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

export default DashboardPage;
