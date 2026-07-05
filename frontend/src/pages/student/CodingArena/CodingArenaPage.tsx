import { useState } from "react";
import { codingProblem } from "../../../data/testFlow";
import Sidebar from "../../../components/student/layout/Sidebar";

function CodingArenaPage() {
  const [activeTab, setActiveTab] = useState<"Testcase" | "Result">("Testcase");
  const [runState, setRunState] = useState<"idle" | "running" | "accepted">("accepted");

  const runCode = () => {
    setRunState("running");
    window.setTimeout(() => setRunState("accepted"), 700);
  };

  return (
    <div className="h-screen overflow-hidden bg-practice-background text-practice-text">
      <Sidebar />

      <main className="flex h-screen flex-col lg:ml-[280px]">
        <header className="flex h-[72px] items-center justify-between border-b border-practice-line bg-white px-4 lg:px-8">
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
              className="rounded-lg border border-practice-ink px-5 py-2 text-sm font-bold text-practice-ink transition hover:bg-practice-ink hover:text-white"
            >
              Run
            </button>
            <button className="rounded-lg bg-practice-ink px-5 py-2 text-sm font-bold text-white transition hover:bg-practice-sidebarActive">
              Submit
            </button>
          </div>
        </header>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[420px_1fr]">
          <section className="custom-scrollbar overflow-y-auto border-r border-practice-line bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded border border-practice-amberDark/30 bg-practice-amber/20 px-2 py-1 text-xs font-extrabold uppercase text-practice-amberDark">
                {codingProblem.difficulty}
              </span>
              <span className="text-sm text-practice-subdued">ID: {codingProblem.id}</span>
            </div>
            <p className="mb-6 leading-relaxed">{codingProblem.description}</p>
            {codingProblem.examples.map((example) => (
              <div key={example.input} className="mb-6">
                <h4 className="mb-3 text-sm font-extrabold">Example 1:</h4>
                <div className="rounded-lg border border-practice-line bg-practice-muted p-4 font-mono text-xs">
                  <p>
                    <strong>Input:</strong> {example.input}
                  </p>
                  <p>
                    <strong>Output:</strong> {example.output}
                  </p>
                  <p>
                    <strong>Explanation:</strong> {example.explanation}
                  </p>
                </div>
              </div>
            ))}
            <h4 className="mb-3 text-sm font-extrabold">Constraints:</h4>
            <ul className="mb-8 list-disc space-y-2 pl-5 text-sm">
              {codingProblem.constraints.map((constraint) => (
                <li key={constraint} className="font-mono">
                  {constraint}
                </li>
              ))}
            </ul>
            <div className="border-t border-practice-line pt-6">
              <h4 className="mb-3 text-sm font-bold text-practice-subdued">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {codingProblem.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-practice-muted px-3 py-1 text-xs font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="flex min-w-0 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col bg-[#1e1e1e]">
              <div className="flex items-center justify-between border-b border-white/5 bg-[#252526] px-4 py-2">
                <div className="border-t-2 border-practice-amber bg-[#1e1e1e] px-4 py-2 text-xs font-medium text-white">
                  solution.py
                </div>
                <div className="text-sm text-white/40">settings fullscreen</div>
              </div>
              <div className="custom-scrollbar flex-1 overflow-y-auto p-4 font-mono text-sm text-[#d4d4d4]">
                <div className="flex gap-4">
                  <div className="w-8 select-none text-right text-white/20">
                    {codingProblem.starterCode.map((_, index) => (
                      <div key={index}>{index + 1}</div>
                    ))}
                  </div>
                  <pre className="whitespace-pre-wrap leading-6">
                    {codingProblem.starterCode.join("\n")}
                  </pre>
                </div>
              </div>
            </div>

            <div className="h-64 border-t border-practice-line bg-white">
              <div className="flex border-b border-practice-line px-4">
                {["Testcase", "Result"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab as "Testcase" | "Result")}
                    className={[
                      "px-6 py-4 text-sm font-bold transition",
                      activeTab === tab
                        ? "border-b-2 border-practice-amberDark text-practice-amberDark"
                        : "text-practice-subdued",
                    ].join(" ")}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {activeTab === "Testcase" ? (
                  <div className="grid gap-8 md:grid-cols-2">
                    <div>
                      <h5 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-practice-subdued">
                        Case 1
                      </h5>
                      <div className="space-y-3">
                        <div className="rounded bg-practice-muted p-2 font-mono text-xs">
                          nums = [2, 7, 11, 15]
                        </div>
                        <div className="rounded bg-practice-muted p-2 font-mono text-xs">
                          target = 9
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-practice-line bg-practice-muted p-4">
                      <p className="mb-2 text-sm font-extrabold text-emerald-700">
                        {runState === "running" ? "Running..." : "Accepted"}
                      </p>
                      <p className="font-mono text-sm text-emerald-700">[0, 1]</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                    All visible test cases passed.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <button className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-practice-amber text-practice-ink shadow-buddy">
        AI
      </button>
    </div>
  );
}

export default CodingArenaPage;
