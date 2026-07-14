import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../../components/student/layout/AppLayout";
import { api, type AiInterviewReport } from "../../../services/api";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Bookmark,
} from "lucide-react";

function AiInterviewReport() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AiInterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTurnIdx, setActiveTurnIdx] = useState(0);

  useEffect(() => {
    if (sessionId) {
      fetchReport();
    }
  }, [sessionId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getInterviewReport(sessionId!);
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRatingBand = (score: number) => {
    if (score >= 90) return { label: "Excellent Candidate", color: "text-emerald-700 bg-emerald-100", border: "border-emerald-200" };
    if (score >= 75) return { label: "Strong Candidate", color: "text-blue-700 bg-blue-100", border: "border-blue-200" };
    if (score >= 60) return { label: "Needs Improvement", color: "text-amber-700 bg-amber-100", border: "border-amber-200" };
    return { label: "Not Ready Yet", color: "text-red-700 bg-red-100", border: "border-red-200" };
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-practice-line border-t-practice-amber" />
          <p className="mt-4 text-xs font-semibold text-practice-subdued">Assembling scorecard report...</p>
        </div>
      </AppLayout>
    );
  }

  if (!report) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center max-w-xl mx-auto mt-10">
          <h3 className="text-sm font-extrabold text-red-700 mb-1">Failed to Load Report</h3>
          <p className="text-xs text-red-600 mb-4">The requested interview session scorecard is unavailable.</p>
          <button
            onClick={() => navigate("/ai-interview")}
            className="rounded-lg bg-red-700 text-white px-4 py-2 text-xs font-bold"
          >
            Back to Dashboard
          </button>
        </div>
      </AppLayout>
    );
  }

  const band = getRatingBand(report.overallScore || 0);

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px] pb-16">
        {/* Navigation back */}
        <button
          onClick={() => navigate("/ai-interview")}
          className="mb-6 flex items-center gap-2 text-xs font-extrabold text-practice-subdued hover:text-practice-ink transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Interview Dashboard
        </button>

        {/* Hero Scorecard */}
        <section className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm mb-8">
          {/* Left overall score donut */}
          <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-practice-line/30 pb-6 md:pb-0 md:pr-6">
            <div className="relative h-32 w-32 flex items-center justify-center">
              {/* Circular SVG Donut */}
              <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#F3F3F4" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#FFC55F"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - (report.overallScore || 0) / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-3xl font-black text-practice-ink block">
                  {report.overallScore}%
                </span>
                <span className="text-[10px] font-bold text-practice-subdued uppercase tracking-widest block mt-0.5">
                  Overall Score
                </span>
              </div>
            </div>
            <span className={["rounded-full px-4 py-1 text-xs font-extrabold mt-4 block", band.color].join(" ")}>
              {band.label}
            </span>
          </div>

          {/* Right report summary */}
          <div className="flex flex-col justify-center">
            <h2 className="text-xl font-extrabold text-practice-ink mb-3">Recruiter Summary Evaluation</h2>
            <p className="text-sm text-practice-subdued leading-relaxed font-medium">
              {report.summary || "Your interview performance scorecard has been generated successfully. Review the category rubrics and corrected answers below to target improvement areas."}
            </p>
          </div>
        </section>

        {/* Key Metrics & Strengths/Weaknesses grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 mb-8">
          {/* Left panel: Strengths, Weaknesses, Recommendations */}
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Strengths */}
              <div className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-practice-ink mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Key Strengths
                </h3>
                {report.strengths.length === 0 ? (
                  <p className="text-xs text-practice-subdued italic">No significant strengths highlighted.</p>
                ) : (
                  <ul className="space-y-3">
                    {report.strengths.map((str, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-practice-subdued leading-relaxed font-semibold">
                        <span className="text-practice-amberDark">&bull;</span>
                        {str}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Weaknesses */}
              <div className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-practice-ink mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-practice-error" />
                  Growth Opportunities
                </h3>
                {report.weaknesses.length === 0 ? (
                  <p className="text-xs text-practice-subdued italic">No major weaknesses highlighted.</p>
                ) : (
                  <ul className="space-y-3">
                    {report.weaknesses.map((weak, idx) => (
                      <li key={idx} className="flex gap-2 text-xs text-practice-subdued leading-relaxed font-semibold">
                        <span className="text-practice-error">&bull;</span>
                        {weak}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Recommended Action Items */}
            <div className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-practice-ink mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-practice-amberDark" />
                Actionable Next Steps
              </h3>
              {report.recommendedPractice.length === 0 ? (
                <p className="text-xs text-practice-subdued italic">No explicit practice tasks recommended.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {report.recommendedPractice.map((rec, idx) => (
                    <div key={idx} className="rounded-xl border border-practice-line/30 bg-practice-surface p-4 flex flex-col justify-between">
                      <div>
                        <strong className="text-xs font-extrabold text-practice-ink flex items-center gap-1.5">
                          <Bookmark className="h-4 w-4 text-practice-amberDark" />
                          {rec.topic}
                        </strong>
                        <p className="text-[11px] text-practice-subdued mt-1.5 leading-relaxed font-medium">
                          {rec.reason}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/practice-tests")}
                        className="mt-4 text-[10px] font-extrabold text-practice-amberDark uppercase tracking-wider flex items-center gap-1 hover:underline text-left"
                      >
                        Start practice test
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Rubrics Progression */}
          <div className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-practice-ink mb-6">Evaluation Category Rubrics</h3>
            <div className="space-y-4">
              {[
                { key: "relevance", label: "Question Relevance", desc: "Did you answer the question directly?" },
                { key: "accuracy", label: "Technical Accuracy", desc: "Domain correctness and logic." },
                { key: "clarity", label: "Communication Clarity", desc: "Pacing, grammar, articulation." },
                { key: "structure", label: "Answer Structuring", desc: "Use of framework formats (e.g. STAR)." },
                { key: "jd_alignment", label: "Role Alignment", desc: "Fit with target job criteria." },
                { key: "confidence", label: "Recruiter Confidence", desc: "Assertiveness and vocabulary." },
                { key: "depth", label: "Evidence Depth", desc: "Metrics and outcome details cited." },
              ].map((item) => {
                const value = report.dashboardMetrics[item.key] || 0;
                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-practice-ink">{item.label}</span>
                      <span className="font-black text-practice-ink">{value}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-practice-muted">
                      <div
                        style={{ width: `${value}%` }}
                        className="h-2 rounded-full bg-practice-amber border border-practice-amberDark/10"
                      />
                    </div>
                    <p className="text-[9px] text-practice-subdued font-medium">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Question Logs */}
        <section className="rounded-2xl border border-practice-line/45 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-practice-ink mb-6">Question-by-Question Transcript Details</h3>
          
          {/* Question Tab Bar */}
          <div className="flex flex-wrap gap-2 border-b border-practice-line/40 pb-4 mb-6">
            {report.turns.map((turn, index) => (
              <button
                key={turn.id}
                onClick={() => setActiveTurnIdx(index)}
                className={[
                  "rounded-lg px-4 py-2 text-xs font-bold border transition",
                  activeTurnIdx === index
                    ? "bg-practice-ink border-practice-ink text-white shadow-md"
                    : "border-practice-line/60 bg-white text-practice-subdued hover:bg-practice-surface",
                ].join(" ")}
              >
                Q{turn.sortOrder}
                <span className="ml-1.5 text-[10px] font-black text-white/50">
                  {turn.score ? `${turn.score}%` : "0%"}
                </span>
              </button>
            ))}
          </div>

          {/* Active Turn Log contents */}
          {report.turns.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
              {/* Left Column: Q&A transcripts + STAR corrected answer */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-practice-subdued mb-1.5">Recruiter Question</h4>
                  <p className="text-sm font-extrabold text-practice-ink leading-relaxed">
                    "{report.turns[activeTurnIdx].question}"
                  </p>
                </div>

                <div className="rounded-xl border border-practice-line/30 bg-practice-surface p-4">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-practice-subdued mb-1.5">Your Transcript Response</h4>
                  <p className="text-xs text-practice-ink leading-relaxed font-semibold italic">
                    "{report.turns[activeTurnIdx].answerTranscript || "[No Answer Transcript Captured]"}"
                  </p>
                </div>

                {report.turns[activeTurnIdx].correctedAnswer && (
                  <div className="rounded-xl border border-practice-amberDark/15 bg-practice-amber/5 p-5">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-practice-amberDark mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4" />
                      Corrected Framework Answer Suggestion
                    </h4>
                    <p className="text-xs text-practice-ink leading-relaxed font-medium whitespace-pre-wrap">
                      {report.turns[activeTurnIdx].correctedAnswer}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Turn Feedback, Mistakes, Missing Keywords */}
              <div className="space-y-6 lg:border-l lg:border-practice-line/30 lg:pl-8">
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-practice-subdued mb-2">Turn Evaluation Feedback</h4>
                  <p className="text-xs text-practice-ink leading-relaxed font-semibold">
                    {report.turns[activeTurnIdx].feedback || "No feedback logged."}
                  </p>
                </div>

                {report.turns[activeTurnIdx].mistakes.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-practice-error mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Mistakes Identified
                    </h4>
                    <ul className="space-y-1.5">
                      {report.turns[activeTurnIdx].mistakes.map((mis, idx) => (
                        <li key={idx} className="text-xs text-practice-error leading-relaxed font-semibold flex items-start gap-1.5">
                          <span>&bull;</span>
                          {mis}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.turns[activeTurnIdx].missingKeywords.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-practice-subdued mb-2">Missing Key Vocabulary</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {report.turns[activeTurnIdx].missingKeywords.map((kw, idx) => (
                        <span key={idx} className="rounded bg-practice-muted px-2.5 py-1 text-[10px] font-bold text-practice-ink">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

export default AiInterviewReport;
