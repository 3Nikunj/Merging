import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../components/student/layout/AppLayout";
import { api, type AiInterviewHistoryItem, type AiInterviewSummary } from "../../../services/api";
import {
  History,
  TrendingUp,
  Briefcase,
  Play,
  Award,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle,
} from "lucide-react";

type Tab = "setup" | "history" | "analytics";

function AiInterviewDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("setup");
  const [history, setHistory] = useState<AiInterviewHistoryItem[]>([]);
  const [summary, setSummary] = useState<AiInterviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);

  // Form State
  const [mode, setMode] = useState<"custom" | "jd_based">("custom");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid-Level");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [skills, setSkills] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [voiceAccent, setVoiceAccent] = useState("af_heart");
  
  // File upload simulation
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractingResume, setExtractingResume] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [historyData, summaryData] = await Promise.all([
        api.getInterviewHistory(),
        api.getInterviewSummary(),
      ]);
      setHistory(historyData);
      setSummary(summaryData);
    } catch (e) {
      console.error("Error loading dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setExtractingResume(true);
      
      // Simulate text extraction
      setTimeout(() => {
        setResumeText(
          `Candidate Profile extracted from ${file.name}.\n` +
          `Primary skills: React, TypeScript, Python, Node.js.\n` +
          `Experience: 3 years building web applications.`
        );
        setExtractingResume(false);
      }, 1000);
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setStartingSession(true);

    try {
      const session = await api.createInterviewSession({
        mode,
        company: mode === "custom" ? company : "JD Focused",
        position: mode === "custom" ? position : "Extracted Role",
        experience_level: experienceLevel,
        interview_type: interviewType,
        difficulty,
        jd_text: mode === "jd_based" ? jdText : `Custom focused interview on: ${skills}`,
        resume_text: resumeText,
        voiceAccent,
      });

      // Route to live room
      navigate(`/ai-interview/live/${session.id}`);
    } catch (err) {
      console.error("Failed to start session", err);
      alert("Could not start interview. Check if your API configurations are correct.");
    } finally {
      setStartingSession(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px] pb-16">
        {/* Hero Section */}
        <header className="mb-10 flex flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-practice-sidebar p-8 text-white shadow-xl sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-practice-amber">
              AI Skill Trainer
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">AI Interview Simulator</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
              Train with our high-speed voice agent tailored to your target job. Receive
              instant granular scorecards and corrected frameworks (STAR) after each attempt.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-6 py-4 backdrop-blur-md">
              <Award className="h-10 w-10 text-practice-amber" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Global Score
                </p>
                <p className="text-2xl font-black">
                  {summary ? `${summary.averageScore}%` : "0%"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="mb-8 flex border-b border-practice-line/50">
          {[
            { id: "setup", label: "Practice Setup", icon: Play },
            { id: "history", label: "My History", icon: History },
            { id: "analytics", label: "Performance Analytics", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={[
                  "flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-extrabold transition-all duration-200 focus:outline-none",
                  activeTab === tab.id
                    ? "border-practice-amberDark text-practice-amberDark"
                    : "border-transparent text-practice-subdued hover:text-practice-ink",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-practice-line border-t-practice-amber" />
            <p className="mt-4 text-xs font-semibold text-practice-subdued">Syncing dashboard...</p>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {/* SETUP TAB */}
            {activeTab === "setup" && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
                {/* Configuration Form */}
                <div className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-extrabold text-practice-ink mb-6">Select Interview Mode</h3>
                  
                  <div className="mb-8 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setMode("custom")}
                      className={[
                        "flex-1 rounded-xl border p-4 text-left transition-all duration-200",
                        mode === "custom"
                          ? "border-practice-amberDark bg-practice-amber/10 shadow-sm"
                          : "border-practice-line/50 hover:bg-practice-surface",
                      ].join(" ")}
                    >
                      <Briefcase className="h-5 w-5 text-practice-amberDark mb-2" />
                      <strong className="text-sm font-extrabold text-practice-ink">Custom Profile</strong>
                      <p className="text-xs text-practice-subdued mt-1">Configure position, skills, and target company details.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("jd_based")}
                      className={[
                        "flex-1 rounded-xl border p-4 text-left transition-all duration-200",
                        mode === "jd_based"
                          ? "border-practice-amberDark bg-practice-amber/10 shadow-sm"
                          : "border-practice-line/50 hover:bg-practice-surface",
                      ].join(" ")}
                    >
                      <FileText className="h-5 w-5 text-practice-amberDark mb-2" />
                      <strong className="text-sm font-extrabold text-practice-ink">Job Description (JD)</strong>
                      <p className="text-xs text-practice-subdued mt-1">Paste a target JD to simulate a custom application review.</p>
                    </button>
                  </div>

                  <form onSubmit={handleStartInterview} className="space-y-6">
                    {mode === "custom" ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-practice-subdued">Target Company</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Stripe, Google"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full rounded-lg border border-practice-line/60 px-4 py-2.5 text-sm outline-none focus:border-practice-amberDark"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-practice-subdued">Target Position</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Fullstack Engineer"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="w-full rounded-lg border border-practice-line/60 px-4 py-2.5 text-sm outline-none focus:border-practice-amberDark"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-practice-subdued">Required Skills</label>
                          <input
                            type="text"
                            placeholder="React, TypeScript, Python, REST APIs (comma-separated)"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            className="w-full rounded-lg border border-practice-line/60 px-4 py-2.5 text-sm outline-none focus:border-practice-amberDark"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-practice-subdued">Job Description Text</label>
                        <textarea
                          required
                          rows={6}
                          placeholder="Paste the job description or target requirements here..."
                          value={jdText}
                          onChange={(e) => setJdText(e.target.value)}
                          className="w-full rounded-lg border border-practice-line/60 px-4 py-3 text-sm outline-none focus:border-practice-amberDark"
                        />
                      </div>
                    )}

                    <hr className="border-practice-line/30" />

                    <div className="grid gap-6 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-practice-subdued">Seniority Level</label>
                        <select
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className="w-full rounded-lg border border-practice-line/60 bg-white px-4 py-2.5 text-sm outline-none focus:border-practice-amberDark"
                        >
                          <option>Internship</option>
                          <option>Entry Level</option>
                          <option>Mid-Level</option>
                          <option>Senior Level</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-practice-subdued">Interview Type</label>
                        <select
                          value={interviewType}
                          onChange={(e) => setInterviewType(e.target.value)}
                          className="w-full rounded-lg border border-practice-line/60 bg-white px-4 py-2.5 text-sm outline-none focus:border-practice-amberDark"
                        >
                          <option>Technical</option>
                          <option>Behavioral</option>
                          <option>HR Screening</option>
                          <option>Managerial</option>
                          <option>Mixed</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-practice-subdued">Difficulty</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className="w-full rounded-lg border border-practice-line/60 bg-white px-4 py-2.5 text-sm outline-none focus:border-practice-amberDark"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-practice-subdued">Interviewer Accent & Voice</label>
                      <select
                        value={voiceAccent}
                        onChange={(e) => setVoiceAccent(e.target.value)}
                        className="w-full rounded-lg border border-practice-line/60 bg-white px-4 py-2.5 text-sm outline-none focus:border-practice-amberDark"
                      >
                        <option value="af_heart">US English - Female (Heart - Default)</option>
                        <option value="af_bella">US English - Female (Bella)</option>
                        <option value="af_sarah">US English - Female (Sarah)</option>
                        <option value="af_nicole">US English - Female (Nicole)</option>
                        <option value="af_sky">US English - Female (Sky)</option>
                        <option value="am_adam">US English - Male (Adam)</option>
                        <option value="am_michael">US English - Male (Michael)</option>
                        <option value="am_fenrir">US English - Male (Fenrir)</option>
                        <option value="bf_emma">UK English - Female (Emma)</option>
                        <option value="bm_george">UK English - Male (George)</option>
                      </select>
                    </div>

                    <div className="rounded-xl border border-practice-line/45 bg-practice-surface p-4">
                      <h4 className="text-xs font-bold text-practice-ink mb-3 uppercase tracking-wider">Candidate Resume (Optional)</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col justify-center items-center border-2 border-dashed border-practice-line rounded-lg p-4 bg-white hover:bg-practice-muted/20 transition cursor-pointer relative">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <Upload className="h-6 w-6 text-practice-subdued mb-2" />
                          <span className="text-xs font-bold text-practice-ink">
                            {uploadedFileName ? uploadedFileName : "Upload PDF or DOC"}
                          </span>
                          <span className="text-[10px] text-practice-subdued mt-1">Max 5MB</span>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-practice-subdued">Resume Text Details</label>
                          <textarea
                            rows={3}
                            placeholder="Or paste highlights / cover letter info here..."
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            className="w-full rounded-lg border border-practice-line/60 px-3 py-2 text-xs outline-none focus:border-practice-amberDark"
                          />
                        </div>
                      </div>
                      {extractingResume && (
                        <p className="text-[10px] text-practice-amberDark font-bold mt-2 animate-pulse">
                          Extracting resume content details...
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={startingSession}
                      className="w-full rounded-xl bg-practice-ink py-4 text-center text-sm font-extrabold text-white transition hover:bg-practice-sidebarActive disabled:opacity-50"
                    >
                      {startingSession ? "Initializing Voice Session..." : "Begin AI Verbal Interview"}
                    </button>
                  </form>
                </div>

                {/* Right Checklist */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
                    <h4 className="text-sm font-extrabold text-practice-ink mb-4">Verification Checklist</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs font-extrabold text-practice-ink">Speech Synthesis Ready</strong>
                          <p className="text-[10px] text-practice-subdued mt-0.5">Built-in TTS synthesizes interview questions instantly offline.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs font-extrabold text-practice-ink">Speech Recognition Active</strong>
                          <p className="text-[10px] text-practice-subdued mt-0.5">Captures your spoken answers in-browser without sending audio data over the wire.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-xs font-extrabold text-practice-ink">Sub-500ms Latency</strong>
                          <p className="text-[10px] text-practice-subdued mt-0.5">Accelerated chat loops powered by Groq's high speed Llama 3 models.</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-practice-line/45 bg-practice-amber/10 p-6 shadow-sm">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-practice-amberDark shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-extrabold text-practice-amberDark">Interview Protocol</h4>
                        <p className="text-xs text-practice-amberDark mt-2 leading-relaxed font-semibold">
                          Once initialized, stay focused inside the live visual room. Skips are limited, and evaluating reports takes roughly 15 seconds to load.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <div className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-extrabold text-practice-ink mb-6">Historical Sessions</h3>
                {history.length === 0 ? (
                  <div className="py-12 text-center">
                    <History className="mx-auto h-12 w-12 text-practice-line mb-4" />
                    <h4 className="text-sm font-extrabold text-practice-ink mb-1">No sessions recorded</h4>
                    <p className="text-xs text-practice-subdued max-w-sm mx-auto">
                      Complete your first AI Verbal Interview session to see scores and breakdown details.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-practice-line bg-practice-surface text-[10px] font-extrabold uppercase tracking-wider text-practice-subdued">
                        <tr>
                          <th className="px-4 py-3">Role / Mode</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Difficulty</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Overall Score</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-practice-line/40">
                        {history.map((item) => {
                          const date = new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });

                          return (
                            <tr key={item.id} className="hover:bg-practice-surface/30">
                              <td className="px-4 py-4">
                                <span className="font-extrabold text-practice-ink block">
                                  {item.position || "System Evaluator"}
                                </span>
                                <span className="text-[10px] text-practice-subdued font-bold mt-1 block">
                                  {item.company} &bull; {item.interviewType}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-practice-subdued font-semibold">{date}</td>
                              <td className="px-4 py-4">
                                <span className="rounded bg-practice-muted px-2.5 py-1 font-bold text-[10px] uppercase text-practice-ink">
                                  {item.difficulty}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={[
                                    "rounded-full px-3 py-1 text-[10px] font-extrabold uppercase",
                                    item.status === "completed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800",
                                  ].join(" ")}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm font-black text-practice-ink">
                                {item.overallScore ? `${item.overallScore}%` : "-"}
                              </td>
                              <td className="px-4 py-4 text-right">
                                {item.status === "completed" ? (
                                  <button
                                    onClick={() => navigate(`/ai-interview/report/${item.id}`)}
                                    className="rounded border border-practice-line bg-white px-3.5 py-1.5 font-bold hover:bg-practice-muted"
                                  >
                                    View Report
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => navigate(`/ai-interview/live/${item.id}`)}
                                    className="rounded bg-practice-ink text-white px-3.5 py-1.5 font-bold hover:bg-practice-sidebarActive"
                                  >
                                    Resume
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Stats Summary Card */}
                <div className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-extrabold text-practice-ink mb-6">General Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-practice-line/30 bg-practice-surface p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-practice-subdued">Total Completed</p>
                      <strong className="text-3xl font-black text-practice-ink mt-2 block">
                        {summary ? summary.totalCompleted : 0}
                      </strong>
                    </div>
                    <div className="rounded-xl border border-practice-line/30 bg-practice-surface p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-practice-subdued">Strongest Area</p>
                      <strong className="text-sm font-black text-emerald-700 mt-2 block truncate">
                        {summary ? summary.strongestArea : "N/A"}
                      </strong>
                    </div>
                    <div className="rounded-xl border border-practice-line/30 bg-practice-surface p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-practice-subdued">Weakest Area</p>
                      <strong className="text-sm font-black text-red-600 mt-2 block truncate">
                        {summary ? summary.weakestArea : "N/A"}
                      </strong>
                    </div>
                    <div className="rounded-xl border border-practice-line/30 bg-practice-surface p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-practice-subdued">Target Target Average</p>
                      <strong className="text-3xl font-black text-practice-ink mt-2 block">
                        {summary ? `${summary.averageScore}%` : "0%"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Score Trend Card */}
                <div className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-extrabold text-practice-ink mb-6">Recent Performance Trend</h3>
                  {summary && summary.recentScores.length > 0 ? (
                    <div className="flex flex-col justify-between h-[200px] pt-4">
                      <div className="flex items-end justify-between h-[130px] border-b border-practice-line pb-2 px-4 gap-6">
                        {summary.recentScores.map((s) => (
                          <div key={s.id} className="flex flex-col items-center flex-1">
                            <div className="text-[10px] font-black text-practice-ink mb-1">{s.score}%</div>
                            <div
                              style={{ height: `${s.score * 0.9}px` }}
                              className="w-full max-w-[28px] rounded-t-md bg-practice-amber border-t border-x border-practice-amberDark/30"
                            />
                            <div className="text-[9px] text-practice-subdued font-bold mt-2 truncate w-full text-center">
                              {s.date}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-practice-subdued text-center mt-2 font-semibold">
                        Progress score plotted chronologically across your last 5 sessions.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center items-center h-[200px] text-center">
                      <History className="h-10 w-10 text-practice-line mb-2" />
                      <p className="text-xs text-practice-subdued">Record 2 or more sessions to plot progress trends.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default AiInterviewDashboard;
