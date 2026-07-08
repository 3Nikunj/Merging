import { useEffect, useRef, useState } from "react";
import { codingProblem } from "../../../data/testFlow";
import Sidebar from "../../../components/student/layout/Sidebar";
import { api, type RunCodeResponse } from "../../../services/api";
import { supabase } from "../../../services/supabase";

type RunStatus = RunCodeResponse["status"] | "idle" | "running" | "submitting";
type ConsoleTab = "Testcase" | "Result" | "Submissions";

const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "text-emerald-600",
  accepted: "text-emerald-600",
  WRONG_ANSWER: "text-red-500",
  wrong_answer: "text-red-500",
  RUNTIME_ERROR: "text-red-500",
  runtime_error: "text-red-500",
  COMPILE_ERROR: "text-amber-600",
  compile_error: "text-amber-600",
  TIMEOUT: "text-amber-600",
  timeout: "text-amber-600",
  NO_TESTS: "text-practice-subdued",
  idle: "text-practice-subdued",
  running: "text-blue-500",
  submitting: "text-blue-500",
};

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "✓ Accepted",
  accepted: "✓ Accepted",
  WRONG_ANSWER: "✗ Wrong Answer",
  wrong_answer: "✗ Wrong Answer",
  RUNTIME_ERROR: "✗ Runtime Error",
  runtime_error: "✗ Runtime Error",
  COMPILE_ERROR: "✗ Compile Error",
  compile_error: "✗ Compile Error",
  TIMEOUT: "⏱ Time Limit Exceeded",
  timeout: "⏱ Time Limit Exceeded",
  NO_TESTS: "No test cases available",
  idle: "Run your code to see results",
  running: "Running…",
  submitting: "Submitting…",
};

const DEFAULT_CODE = `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your implementation here
        prevMap = {}  # val : index

        for i, n in enumerate(nums):
            diff = target - n
            if diff in prevMap:
                return [prevMap[diff], i]
            prevMap[n] = i`;

interface SubmissionRow {
  id: string;
  problem_id: string;
  language: string;
  code: string;
  status: string;
  tests_passed: number;
  total_tests: number;
  submitted_at: string;
  stdout: string | null;
  stderr: string | null;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function CodingArenaPage() {
  const [activeTab, setActiveTab] = useState<ConsoleTab>("Testcase");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runResult, setRunResult] = useState<RunCodeResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionsError, setSubmissionsError] = useState(false);
  const [selectedSubmissionForView, setSelectedSubmissionForView] = useState<SubmissionRow | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load the current user ID once on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });
  }, []);

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
    }
  };

  const runCode = async () => {
    setRunStatus("running");
    setActiveTab("Result");
    try {
      const result = await api.runCode(codingProblem.id, code);
      setRunResult(result);
      setRunStatus(result.status);
    } catch {
      setRunResult({
        status: "RUNTIME_ERROR",
        stdout: "",
        stderr: "Failed to connect to the execution server.",
        testsPassed: 0,
        totalTests: 0,
      });
      setRunStatus("RUNTIME_ERROR");
    }
  };

  const fetchSubmissions = async (uid: string) => {
    setLoadingSubmissions(true);
    setSubmissionsError(false);
    try {
      const data = await api.getCodingSubmissions(uid, codingProblem.id);
      setSubmissions(data.submissions);
    } catch {
      setSubmissionsError(true);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const submitCode = async () => {
    if (!userId) return;
    setRunStatus("submitting");
    setActiveTab("Result");
    try {
      const result = await api.submitCode(codingProblem.id, code, userId);
      // Always update the result display regardless of what happens next
      setRunResult(result);
      setRunStatus(result.status);
    } catch {
      setRunResult({
        status: "RUNTIME_ERROR",
        stdout: "",
        stderr: "Failed to connect to the submission server.",
        testsPassed: 0,
        totalTests: 0,
      });
      setRunStatus("RUNTIME_ERROR");
    }
    // Refresh submissions list non-blockingly
    fetchSubmissions(userId).catch(() => undefined);
  };

  const handleTabClick = (tab: ConsoleTab) => {
    setActiveTab(tab);
    if (tab === "Submissions" && userId) {
      fetchSubmissions(userId);
    }
  };

  const consoleOutput = runResult
    ? runResult.stdout || runResult.stderr || "No output."
    : null;

  const isExecuting = runStatus === "running" || runStatus === "submitting";

  return (
    <div className="h-screen overflow-hidden bg-practice-background text-practice-text">
      <Sidebar />

      <main className="flex h-screen flex-col lg:ml-[280px]">
        {/* Header */}
        <header className="flex h-[72px] items-center justify-between border-b border-practice-line bg-white px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-extrabold text-practice-ink">{codingProblem.title}</h2>
            <div className="rounded border border-practice-line bg-practice-muted px-3 py-1.5 text-sm">
              {codingProblem.language}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runCode}
              disabled={isExecuting}
              className="rounded-lg border border-practice-ink px-5 py-2 text-sm font-bold text-practice-ink transition-all duration-200 hover:bg-practice-ink hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-offset-2"
            >
              {runStatus === "running" ? "Running…" : "Run"}
            </button>
            <button
              type="button"
              onClick={submitCode}
              disabled={isExecuting || !userId}
              className="rounded-lg bg-practice-ink px-5 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-practice-sidebarActive disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-offset-2"
            >
              {runStatus === "submitting" ? "Submitting…" : "Submit"}
            </button>
          </div>
        </header>

        {/* Main layout: problem panel + editor panel */}
        <div className="grid flex-1 overflow-hidden grid-cols-1 lg:grid-cols-[420px_1fr]">
          {/* Left: Problem description */}
          <section className="custom-scrollbar overflow-y-auto border-r border-practice-line bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded border border-practice-amberDark/30 bg-practice-amber/20 px-2 py-1 text-xs font-extrabold uppercase text-practice-amberDark">
                {codingProblem.difficulty}
              </span>
              <span className="text-sm text-practice-subdued">ID: {codingProblem.id}</span>
            </div>
            <p className="mb-6 leading-relaxed">{codingProblem.description}</p>
            {codingProblem.examples.map((example, idx) => (
              <div key={example.input} className="mb-6">
                <h4 className="mb-3 text-sm font-extrabold">Example {idx + 1}:</h4>
                <div className="rounded-lg border border-practice-line bg-practice-muted p-4 font-mono text-xs space-y-1">
                  <p><strong>Input:</strong> {example.input}</p>
                  <p><strong>Output:</strong> {example.output}</p>
                  <p><strong>Explanation:</strong> {example.explanation}</p>
                </div>
              </div>
            ))}
            <h4 className="mb-3 text-sm font-extrabold">Constraints:</h4>
            <ul className="mb-8 list-disc space-y-2 pl-5 text-sm">
              {codingProblem.constraints.map((constraint) => (
                <li key={constraint} className="font-mono">{constraint}</li>
              ))}
            </ul>
            <div className="border-t border-practice-line pt-6">
              <h4 className="mb-3 text-sm font-bold text-practice-subdued">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {codingProblem.tags.map((tag) => (
                  <span key={tag} className="rounded bg-practice-muted px-2.5 py-1 text-xs font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Right: Editor + console */}
          <div className="flex flex-col overflow-hidden bg-[#1e1e1e] text-white">
            {/* File tab bar */}
            <div className="flex border-b border-white/10 bg-[#181818] px-4 py-2 font-mono text-xs text-white/50 shrink-0">
              solution.py
            </div>

            {/* Editable code textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleTabKey}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className="custom-scrollbar flex-1 resize-none overflow-auto bg-[#1e1e1e] p-6 font-mono text-xs leading-relaxed text-[#d4d4d4] outline-none selection:bg-[#264f78]"
            />

            {/* Console panel */}
            <div className="flex flex-col border-t border-white/10 bg-white text-practice-ink h-[260px] shrink-0 overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-practice-line bg-practice-muted/40 shrink-0">
                {(["Testcase", "Result", "Submissions"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabClick(tab)}
                    className={[
                      "px-5 py-3 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-inset",
                      activeTab === tab
                        ? "border-b-2 border-practice-amberDark text-practice-amberDark"
                        : "text-practice-subdued hover:text-practice-ink",
                    ].join(" ")}
                  >
                    {tab}
                    {tab === "Submissions" && submissions.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-practice-amberDark/10 px-1.5 py-0.5 text-[10px] font-extrabold text-practice-amberDark">
                        {submissions.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Console content */}
              <div className="flex-1 overflow-auto p-5">
                {activeTab === "Testcase" && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h5 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-practice-subdued">Case 1</h5>
                      <div className="space-y-2">
                        <div className="rounded bg-practice-muted p-2 font-mono text-xs">nums = [2, 7, 11, 15]</div>
                        <div className="rounded bg-practice-muted p-2 font-mono text-xs">target = 9</div>
                      </div>
                    </div>
                    <div>
                      <h5 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-practice-subdued">Expected</h5>
                      <div className="rounded bg-practice-muted p-2 font-mono text-xs">[0, 1]</div>
                    </div>
                  </div>
                )}

                {activeTab === "Result" && (
                  <div>
                    <p className={`mb-3 text-sm font-extrabold ${STATUS_COLORS[runStatus]}`}>
                      {STATUS_LABELS[runStatus]}
                      {runResult && !["idle", "running", "submitting"].includes(runStatus) && (
                        <span className="ml-2 text-xs font-normal text-practice-subdued">
                          ({runResult.testsPassed}/{runResult.totalTests} tests passed)
                        </span>
                      )}
                    </p>
                    {consoleOutput && (
                      <pre className="custom-scrollbar max-h-[120px] overflow-auto rounded-lg bg-practice-muted p-3 font-mono text-xs leading-relaxed text-practice-ink whitespace-pre-wrap">
                        {consoleOutput}
                      </pre>
                    )}
                    {runStatus === "idle" && (
                      <p className="text-xs text-practice-subdued mt-1">
                        Click <strong>Run</strong> to test or <strong>Submit</strong> to save your solution.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "Submissions" && (
                  <div>
                    {loadingSubmissions ? (
                      <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="flex items-center justify-between border-b border-practice-line py-3">
                            <div className="flex gap-4">
                              <div className="h-4 w-24 rounded bg-practice-line" />
                              <div className="h-4 w-12 rounded bg-practice-line" />
                            </div>
                            <div className="flex gap-4">
                              <div className="h-4 w-20 rounded bg-practice-line" />
                              <div className="h-4 w-16 rounded bg-practice-line" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : submissionsError ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                        <p className="text-xs font-bold text-red-700 mb-1">Unable to load submissions</p>
                        <p className="text-xs text-red-600">
                          Submission history is temporarily unavailable. Please try again in a few moments.
                        </p>
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <svg className="mb-3 h-10 w-10 text-practice-subdued" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h6 className="text-sm font-extrabold text-practice-ink mb-1">No submissions yet</h6>
                        <p className="text-xs text-practice-subdued max-w-sm">
                          Write your solution code and click <strong>Submit</strong> to start building your attempt history.
                        </p>
                      </div>
                    ) : (
                      <div className="min-w-full overflow-x-auto custom-scrollbar">
                        <table className="min-w-full text-left text-xs text-practice-ink">
                          <thead className="border-b border-practice-line bg-practice-muted/50 text-[10px] font-extrabold uppercase tracking-wider text-practice-subdued">
                            <tr>
                              <th className="py-2 px-3">Verdict</th>
                              <th className="py-2 px-3">Time</th>
                              <th className="py-2 px-3">Language</th>
                              <th className="py-2 px-3">Runtime</th>
                              <th className="py-2 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-practice-line">
                            {submissions.map((sub) => {
                              const timeAgo = formatTime(sub.submitted_at);
                              const mockRuntime = `${(sub.code.length % 15) + 12} ms`;

                              return (
                                <tr key={sub.id} className="hover:bg-practice-muted/30">
                                  <td className="py-3 px-3">
                                    <span className={`font-extrabold flex items-center gap-1.5 ${STATUS_COLORS[sub.status]}`}>
                                      {STATUS_LABELS[sub.status] ?? sub.status}
                                      <span className="text-[10px] font-normal text-practice-subdued">
                                        ({sub.tests_passed}/{sub.total_tests})
                                      </span>
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-practice-subdued font-medium">{timeAgo}</td>
                                  <td className="py-3 px-3 uppercase font-semibold text-practice-subdued">{sub.language}</td>
                                  <td className="py-3 px-3 font-mono text-practice-subdued">{mockRuntime}</td>
                                  <td className="py-3 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSubmissionForView(sub)}
                                      className="rounded border border-practice-line bg-white px-2.5 py-1 font-bold text-practice-ink transition hover:bg-practice-muted active:scale-[0.97]"
                                    >
                                      View Code
                                    </button>
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
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Code details view modal */}
      {selectedSubmissionForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-practice-line bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="flex items-center justify-between border-b border-practice-line bg-practice-muted/40 px-6 py-4">
              <div>
                <h3 className="text-sm font-extrabold text-practice-ink">Submission Code Details</h3>
                <p className="text-xs text-practice-subdued mt-0.5">
                  Submitted on {formatTime(selectedSubmissionForView.submitted_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmissionForView(null)}
                className="text-practice-subdued hover:text-practice-ink font-bold text-base transition-colors"
              >
                ✕
              </button>
            </header>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-6 text-xs border-b border-practice-line pb-4">
                <div>
                  <span className="text-practice-subdued font-medium">Verdict:</span>
                  <span className={`font-extrabold ml-1.5 ${STATUS_COLORS[selectedSubmissionForView.status]}`}>
                    {STATUS_LABELS[selectedSubmissionForView.status] ?? selectedSubmissionForView.status}
                  </span>
                </div>
                <div>
                  <span className="text-practice-subdued font-medium">Test Cases:</span>
                  <span className="font-bold text-practice-ink ml-1.5">
                    {selectedSubmissionForView.tests_passed} / {selectedSubmissionForView.total_tests} Passed
                  </span>
                </div>
                <div>
                  <span className="text-practice-subdued font-medium">Language:</span>
                  <span className="font-bold text-practice-ink ml-1.5 uppercase">
                    {selectedSubmissionForView.language}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-practice-subdued block">
                  Source Code
                </label>
                <pre className="rounded-lg bg-[#1e1e1e] p-4 text-xs font-mono text-[#d4d4d4] overflow-auto max-h-[300px] leading-relaxed custom-scrollbar selection:bg-[#264f78]">
                  <code>{selectedSubmissionForView.code}</code>
                </pre>
              </div>

              {(selectedSubmissionForView.stdout || selectedSubmissionForView.stderr) && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-practice-subdued block">
                    Execution Output
                  </label>
                  <pre className="rounded-lg bg-practice-muted p-3 text-xs font-mono text-practice-ink overflow-auto max-h-[120px] leading-relaxed custom-scrollbar">
                    <code>{selectedSubmissionForView.stdout || selectedSubmissionForView.stderr}</code>
                  </pre>
                </div>
              )}
            </div>

            <footer className="border-t border-practice-line bg-practice-muted/20 px-6 py-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedSubmissionForView(null)}
                className="rounded-lg bg-practice-ink px-5 py-2.5 text-xs font-bold text-white transition hover:bg-practice-sidebarActive active:scale-[0.97]"
              >
                Close Details
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* AI Assistant button */}
      <button
        type="button"
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-practice-amber text-practice-ink shadow-buddy hover:scale-105 transition-transform"
      >
        AI
      </button>
    </div>
  );
}

export default CodingArenaPage;
