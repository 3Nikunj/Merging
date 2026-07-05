import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MetricCard from "../../../components/student/testFlow/MetricCard";
import PracticeShell from "../../../components/student/testFlow/PracticeShell";
import { selectedTest } from "../../../data/testFlow";
import { api } from "../../../services/api";
import type { TestSummary } from "../../../types/testFlow";

const checklist = [
  "My internet connection is stable and fast.",
  "I am in a quiet environment and will not be disturbed.",
  "I have a rough sheet and pen ready for calculations.",
  "I am ready to start and focus for the next 45 minutes.",
];

function TestInstructionsPage() {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [test, setTest] = useState<TestSummary>(selectedTest);

  const allChecked = checkedItems.length === checklist.length;

  const toggleChecklistItem = (item: string) => {
    setCheckedItems((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
    setShowWarning(false);
  };

  useEffect(() => {
    api
      .getSelectionData()
      .then((data) => setTest(data.selectedTest))
      .catch(() => setTest(selectedTest));
  }, []);

  const handleStart = async () => {
    if (!allChecked) {
      setShowWarning(true);
      return;
    }

    try {
      const attempt = await api.startAttempt();
      navigate(`/practice-tests/live?attemptId=${attempt.id}`);
    } catch {
      navigate("/practice-tests/live");
    }
  };

  return (
    <PracticeShell title="Test Instructions">
      <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-lg border border-practice-line bg-white shadow-dashboard">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-extrabold text-practice-ink">
              {test.title}
            </h1>
            <div className="mb-6 mt-3 h-1.5 w-24 rounded-full bg-practice-amberDark" />

            <div className="grid gap-4 rounded-lg border border-practice-line bg-practice-background p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-practice-subdued">
                  Subject
                </p>
                <p className="font-extrabold text-practice-ink">{test.subject}</p>
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-practice-subdued">
                  Topic
                </p>
                <p className="font-extrabold text-practice-ink">{test.topic}</p>
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-practice-subdued">
                  Subtopic
                </p>
                <p className="font-extrabold text-practice-ink">{test.subtopic}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-6 pb-8 sm:px-8 md:grid-cols-4">
            <MetricCard label="Questions" value={`${test.questions}`} icon="Q" />
            <MetricCard label="Duration" value={`${test.duration} Mins`} icon="T" />
            <MetricCard label="Total Marks" value={`${test.totalMarks}`} icon="M" />
            <MetricCard label="Difficulty" value={test.difficulty} icon="D" />
          </div>

          <div className="border-t border-practice-line px-6 py-8 sm:px-8">
            <h2 className="mb-4 text-xl font-bold text-practice-ink">General Instructions</h2>
            <ul className="space-y-4 text-practice-subdued">
              <li>Ensure you have a stable internet connection before starting.</li>
              <li>
                <span className="font-bold text-practice-text">Negative Marking:</span> Each
                incorrect answer deducts 0.25 marks.
              </li>
              <li>Calculators, mobile phones, or extra electronic devices are prohibited.</li>
              <li>The test auto-submits when the timer ends.</li>
            </ul>
          </div>

          <div
            className={[
              "border-t border-practice-line bg-practice-background px-6 py-8 sm:px-8",
              showWarning ? "ring-2 ring-red-500" : "",
            ].join(" ")}
          >
            <h2 className="mb-4 text-xl font-bold text-practice-ink">
              Pre-Test Readiness Checklist
            </h2>
            <div className="space-y-3">
              {checklist.map((item) => {
                const isChecked = checkedItems.includes(item);

                return (
                  <label
                    key={item}
                    className={[
                      "flex cursor-pointer items-center gap-4 rounded-lg border bg-white p-4 transition",
                      isChecked
                        ? "border-practice-amberDark bg-practice-amber/10"
                        : "border-practice-line hover:border-practice-amberDark/50",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChecklistItem(item)}
                      className="h-5 w-5 accent-practice-ink"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
            {showWarning ? (
              <p className="mt-4 text-sm font-bold text-red-600">
                Please acknowledge all checklist items before starting the test.
              </p>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-practice-line bg-white p-6 shadow-dashboard">
            <h3 className="mb-6 text-xl font-bold text-practice-ink">Session Summary</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-practice-line pb-3">
                <span className="text-practice-subdued">Estimated Time</span>
                <span className="font-bold">{test.duration} mins</span>
              </div>
              <div className="flex justify-between border-b border-practice-line pb-3">
                <span className="text-practice-subdued">Passing Score</span>
                <span className="font-bold">{test.passingScore}</span>
              </div>
              <div className="flex justify-between border-b border-practice-line pb-3">
                <span className="text-practice-subdued">Attempts Allowed</span>
                <span className="font-bold">{test.attemptsAllowed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-practice-subdued">Last Best Score</span>
                <span className="font-bold text-practice-amberDark">{test.bestScore}</span>
              </div>
            </div>
            <div className="mt-8 rounded-lg border border-practice-ink/10 bg-practice-ink/5 p-4 text-sm text-practice-ink">
              This test is AI-proctored. Keep your environment stable and distraction-free.
            </div>
          </div>
          <div className="rounded-lg bg-practice-ink p-6 text-white shadow-dashboard">
            <p className="text-practice-amber">You're in the top 15%</p>
            <p className="mt-1 text-sm text-white/65">
              Based on your recent Quant performance.
            </p>
          </div>
        </aside>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-40 flex flex-col gap-4 border-t border-practice-line bg-white px-4 py-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between lg:left-[280px] lg:px-6">
        <Link
          to="/practice-tests/selection"
          className="rounded-lg border-2 border-practice-ink px-6 py-3 text-center text-sm font-extrabold text-practice-ink transition hover:bg-practice-ink hover:text-white"
        >
          Back to Selection
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-practice-subdued">Secure AI Environment Enabled</p>
          <button
            type="button"
            onClick={handleStart}
            className="rounded-lg bg-practice-ink px-10 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-practice-sidebarActive"
          >
            Start Test Now
          </button>
        </div>
      </footer>
    </PracticeShell>
  );
}

export default TestInstructionsPage;
