import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { liveQuestion, selectedTest } from "../../../data/testFlow";
import { api } from "../../../services/api";
import type { LiveQuestion } from "../../../types/testFlow";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function LiveTestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const [remainingSeconds, setRemainingSeconds] = useState(44 * 60 + 52);
  const [selectedOption, setSelectedOption] = useState(liveQuestion.answerId ?? "");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [marked, setMarked] = useState<number[]>([]);
  const [question, setQuestion] = useState<LiveQuestion>(liveQuestion);
  const [totalQuestions, setTotalQuestions] = useState(selectedTest.questions);
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!attemptId) {
      return;
    }

    api
      .getAttemptQuestions(attemptId, currentQuestion)
      .then((response) => {
        setQuestion(response.question);
        setCurrentQuestion(response.question.id);
        setSelectedOption(response.question.answerId ?? "");
        setMarked(response.markedQuestions);
        setTotalQuestions(response.totalQuestions);
        setAnsweredCount(response.attempt.answeredCount);
      })
      .catch(() => undefined);
  }, [attemptId, currentQuestion]);

  const questionButtons = useMemo(
    () =>
      Array.from({ length: totalQuestions }, (_, index) => {
        const number = index + 1;

        if (number === currentQuestion) {
          return { number, status: "current" };
        }

        if (marked.includes(number)) {
          return { number, status: "marked" };
        }

        if (number < question.id) {
          return { number, status: "answered" };
        }

        return { number, status: "not_answered" };
      }),
    [currentQuestion, marked, question.id, totalQuestions],
  );

  const toggleMarked = () => {
    setMarked((current) =>
      current.includes(currentQuestion)
        ? current.filter((value) => value !== currentQuestion)
        : [...current, currentQuestion],
    );
  };

  const handleSaveNext = async () => {
    if (attemptId) {
      await api.saveAnswer(attemptId, currentQuestion, selectedOption || null).catch(() => undefined);
    }

    setAnsweredCount((current) => Math.max(current, currentQuestion));

    if (currentQuestion >= totalQuestions) {
      if (attemptId) {
        await api.submitAttempt(attemptId).catch(() => undefined);
      }
      navigate(attemptId ? `/practice-tests/results?attemptId=${attemptId}` : "/practice-tests/results");
      return;
    }

    setSelectedOption("");
    setCurrentQuestion((current) => current + 1);
  };

  const questionButtonClass = (status: string) => {
    if (status === "answered") {
      return "bg-emerald-600 text-white";
    }

    if (status === "marked") {
      return "bg-practice-amberDark text-white";
    }

    if (status === "current") {
      return "border-2 border-practice-amber bg-white font-extrabold text-practice-ink";
    }

    return "bg-white/10 text-white/45";
  };

  return (
    <div className="h-screen overflow-hidden bg-practice-background text-practice-text">
      <header className="fixed left-0 top-0 z-50 flex h-[72px] w-full items-center justify-between border-b border-white/10 bg-practice-sidebar px-4 text-white lg:px-6">
        <div>
          <p className="text-xl font-extrabold text-practice-amber">AiValytics</p>
          <p className="text-sm text-white/65">{selectedTest.title}</p>
        </div>
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-2 sm:flex">
          <Clock3 className="h-4 w-4 text-practice-amber" aria-hidden="true" />
          <span
            className={[
              "text-xl font-extrabold tracking-widest",
              remainingSeconds < 300 ? "text-red-300" : "text-white",
            ].join(" ")}
          >
            {formatTime(remainingSeconds)}
          </span>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (attemptId) {
              await api.submitAttempt(attemptId).catch(() => undefined);
            }
            navigate(attemptId ? `/practice-tests/results?attemptId=${attemptId}` : "/practice-tests/results");
          }}
          className="rounded-lg border border-white/10 bg-practice-ink px-5 py-2 text-sm font-bold transition hover:bg-practice-amber hover:text-practice-ink"
        >
          Submit Test
        </button>
      </header>

      <aside className="fixed bottom-0 left-0 top-[72px] z-40 hidden w-[280px] flex-col bg-practice-sidebar p-6 text-white lg:flex">
        <div className="mb-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-practice-amber text-sm font-bold">
              PP
            </div>
            <div>
              <p className="font-bold">Placement Prep</p>
              <p className="text-[10px] uppercase tracking-wider text-white/60">
                Section: Technical MCQ
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/5 p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-white/80">Progress</span>
              <span className="text-practice-amber">
                {answeredCount} of {totalQuestions} Answered
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-practice-amber"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-5 gap-3">
            {questionButtons.map((item) => (
              <button
                key={item.number}
                type="button"
                onClick={() => {
                  setSelectedOption("");
                  setCurrentQuestion(item.number);
                }}
                className={[
                  "flex aspect-square items-center justify-center rounded-lg text-sm transition hover:scale-105 active:scale-95",
                  questionButtonClass(item.status),
                ].join(" ")}
              >
                {item.number}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-y-3 border-t border-white/10 pt-6 text-[10px] text-white/60">
          <span>Answered</span>
          <span>Not Answered</span>
          <span>Marked</span>
          <span>Current</span>
        </div>
      </aside>

      <main className="flex h-screen flex-col overflow-hidden pt-[72px] lg:ml-[280px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-[800px] space-y-6">
            <div className="text-sm font-semibold text-practice-subdued">
              {selectedTest.subject} &gt; {selectedTest.topic}
            </div>

            <section className="rounded-lg border border-practice-line bg-white p-6 shadow-dashboard">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-practice-ink">
                    Question {currentQuestion}
                  </h1>
                  <div className="mt-2 h-1 w-12 rounded-full bg-practice-amberDark" />
                </div>
                <div className="rounded-full bg-practice-muted px-4 py-2 text-sm font-bold text-practice-amberDark">
                  {question.points} Points
                </div>
              </div>

              <p className="mb-8 text-lg leading-relaxed text-practice-text">
                {question.text}
              </p>

              <div className="space-y-4">
                {question.options.map((option) => {
                  const isSelected = selectedOption === option.id;

                  return (
                    <label key={option.id} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="mcq"
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => setSelectedOption(option.id)}
                      />
                      <div
                        className={[
                          "flex items-center rounded-lg border p-4 transition hover:bg-practice-muted",
                          isSelected
                            ? "border-practice-amberDark bg-practice-amber/15 ring-1 ring-practice-amberDark"
                            : "border-practice-line bg-white",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "mr-4 flex h-8 w-8 items-center justify-center rounded-full border font-extrabold",
                            isSelected
                              ? "border-practice-amberDark bg-practice-amberDark text-white"
                              : "border-practice-line text-practice-subdued",
                          ].join(" ")}
                        >
                          {option.label}
                        </span>
                        {option.value}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-practice-line/60 bg-white/60 p-5">
                <h4 className="mb-2 text-sm font-extrabold text-practice-subdued">
                  Calculator Hint
                </h4>
                <p className="text-sm text-practice-subdued">
                  A prime number is greater than 1 and has no positive divisors other than 1 and itself.
                </p>
              </div>
              <div className="rounded-lg border border-practice-line/60 bg-white/60 p-5">
                <h4 className="mb-2 text-sm font-extrabold text-practice-subdued">
                  Quick Reference
                </h4>
                <ul className="space-y-1 text-sm text-practice-subdued">
                  <li>p + q = 12</li>
                  <li>Find p2 - q2</li>
                  <li>Hint: (p+q)(p-q)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex h-20 items-center justify-between border-t border-practice-line bg-white px-4 sm:px-6">
          <Link
            to="/practice-tests/instructions"
            className="rounded-lg border border-practice-line px-5 py-2.5 text-sm font-bold text-practice-subdued transition hover:bg-practice-muted"
          >
            Previous
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMarked}
              className="rounded-lg px-5 py-2.5 text-sm font-bold text-practice-amberDark transition hover:bg-practice-amber/20"
            >
              Mark for Review
            </button>
            <button
              type="button"
              onClick={handleSaveNext}
              className="rounded-lg bg-practice-sidebar px-6 py-2.5 text-sm font-bold text-white transition hover:bg-practice-sidebarActive"
            >
              Save & Next
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LiveTestPage;
