import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MetricCard from "../../../components/student/testFlow/MetricCard";
import AppLayout from "../../../components/student/layout/AppLayout";
import StatusBadge from "../../../components/student/testFlow/StatusBadge";
import { answerReview, resultBreakdown, selectedTest } from "../../../data/testFlow";
import { api, type AttemptResultResponse } from "../../../services/api";
import { useSearchParams } from "react-router-dom";

function ResultsPage() {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "demo-attempt";
  const [result, setResult] = useState<AttemptResultResponse>({
    attemptId,
    title: selectedTest.title,
    overallScore: 78,
    correct: 24,
    incorrect: 4,
    skipped: 2,
    timeTaken: "38:15",
    percentile: "92nd",
    breakdown: resultBreakdown,
    answerReview,
  });

  useEffect(() => {
    api
      .getAttemptResult(attemptId)
      .then(setResult)
      .catch(() => undefined);
  }, [attemptId]);

  return (
    <AppLayout>
      <main className="mx-auto max-w-[1280px]">
        <section className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <nav className="mb-2 text-sm font-semibold text-practice-subdued">
              Practice Tests &gt; Analytics
            </nav>
            <h1 className="text-3xl font-extrabold text-practice-ink">
              Performance Analysis: {result.title}
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-practice-subdued">
              Excellent effort. Your understanding of prime concepts is above average,
              with notable speed in factor identification.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/practice-tests/instructions"
              className="rounded-lg border-2 border-practice-ink px-5 py-3 text-sm font-extrabold text-practice-ink transition-all duration-200 hover:bg-practice-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-offset-2 focus-visible:ring-offset-practice-background"
            >
              Retry Test
            </Link>
            <button className="rounded-lg bg-practice-amberDark px-5 py-3 text-sm font-extrabold text-white transition-all duration-200 hover:bg-practice-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-offset-2 focus-visible:ring-offset-practice-background">
              Download Result
            </button>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg border border-practice-line bg-white p-6 text-center shadow-dashboard transition-all duration-300 hover:shadow-lg">
            <div
              className="mx-auto flex h-32 w-32 items-center justify-center rounded-full"
              style={{
                background: "conic-gradient(#7d5700 78%, #f3f3f4 0)",
              }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-extrabold text-practice-ink">
                  {result.overallScore}%
                </span>
                <span className="text-sm text-[#2d2f34]">Overall</span>
              </div>
            </div>
            <p className="mt-4 text-xl font-bold text-practice-amberDark">
              Strong Performance
            </p>
          </div>

          <div className="rounded-lg border border-practice-line bg-white p-6 shadow-dashboard transition-all duration-300 hover:shadow-lg">
            <p className="mb-4 text-xs font-extrabold uppercase tracking-wider text-[#2d2f34]">
              Question Stats
            </p>
            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between">
                <span>Correct</span>
                <span className="font-extrabold text-emerald-700">{result.correct}</span>
              </div>
              <div className="flex justify-between">
                <span>Incorrect</span>
                <span className="font-extrabold text-rose-700">{result.incorrect}</span>
              </div>
              <div className="flex justify-between">
                <span>Skipped</span>
                <span className="font-extrabold text-practice-subdued">{result.skipped}</span>
              </div>
            </div>
          </div>

          <MetricCard label="Time Taken" value={result.timeTaken} icon="T" />
          <MetricCard label="Global Percentile" value={result.percentile} icon="P" dark />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-practice-line bg-white p-6 shadow-dashboard lg:col-span-2">
            <h2 className="mb-6 text-xl font-bold text-practice-ink">
              Topic-wise Performance
            </h2>
            <div className="space-y-8">
              {result.breakdown.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-sm font-bold">
                    <span>{item.label}</span>
                    <span>{item.score}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-practice-muted">
                    <div
                      className="h-full rounded-full bg-practice-amberDark"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-practice-line pt-8">
              <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-[#2d2f34]">
                Weak Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Advanced Divisibility", "Co-prime Logic", "Composite Factorization"].map(
                  (area) => (
                    <span
                      key={area}
                      className="rounded-full bg-practice-muted px-4 py-2 text-sm font-bold text-[#2d2f34]"
                    >
                      {area}
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <h2 className="text-xl font-bold text-practice-ink">Recommended Next</h2>
            {["LCM & HCF Masterclass", "Modular Arithmetic"].map((title) => (
              <div
                key={title}
                className="rounded-lg border border-practice-line bg-white p-6 shadow-dashboard transition-all duration-300 ease-out hover:-translate-y-1 hover:border-practice-amber hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded bg-practice-amber/30 font-extrabold text-practice-amberDark">
                  R
                </div>
                <h3 className="mb-2 text-xl font-bold text-practice-ink">{title}</h3>
                <p className="mb-4 text-sm text-[#2d2f34]">
                  Continue strengthening foundations with focused practice and shortcuts.
                </p>
                <span className="text-xs font-extrabold uppercase text-practice-amberDark">
                  Intermediate
                </span>
              </div>
            ))}
          </aside>
        </div>

        <section className="overflow-hidden rounded-lg border border-practice-line bg-white shadow-dashboard">
          <div className="flex items-center justify-between border-b border-practice-line px-6 py-5">
            <h2 className="text-xl font-bold text-practice-ink">Answer Review</h2>
            <select className="rounded-lg border border-practice-line px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber">
              <option>All Questions</option>
              <option>Incorrect Only</option>
              <option>Skipped Only</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-practice-muted text-xs uppercase tracking-wider text-[#2d2f34]">
                <tr>
                  <th className="px-6 py-4">Q.No</th>
                  <th className="px-6 py-4">Question Preview</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Topic</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-practice-line">
                {result.answerReview.map((row) => (
                  <tr key={row.id} className="transition hover:bg-practice-muted/60">
                    <td className="px-6 py-5 font-extrabold">{row.id}</td>
                    <td className="px-6 py-5">{row.preview}</td>
                    <td className="px-6 py-5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-5">{row.topic}</td>
                    <td className="px-6 py-5">
                      <button className="font-extrabold text-practice-amberDark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber rounded px-1">
                        View Explanation
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-practice-muted px-6 py-4 text-center">
            <button className="font-extrabold text-practice-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber rounded px-2 py-1">Show More Questions</button>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}

export default ResultsPage;
