import type { PracticeTestCardData } from "../../../types/practiceTest";
import { Link } from "react-router-dom";

interface PracticeTestCardProps {
  test: PracticeTestCardData;
}

const statusClasses: Record<PracticeTestCardData["status"], string> = {
  "Not Started": "bg-practice-amber/20 text-practice-amberDark",
  "In Progress": "bg-practice-amber text-practice-amberDark",
  Completed: "bg-emerald-100 text-emerald-700",
};

const difficultyClasses: Record<PracticeTestCardData["difficulty"], string> = {
  Easy: "text-emerald-700",
  Medium: "text-amber-700",
  Hard: "text-red-700",
};

function getButtonText(status: PracticeTestCardData["status"]) {
  if (status === "In Progress") {
    return "Resume Test";
  }

  if (status === "Completed") {
    return "View Result";
  }

  return "Start Test";
}

function PremiumCard() {
  return (
    <article className="flex min-h-[230px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-practice-line bg-white/35 p-6 text-center opacity-75 transition-all duration-300 hover:opacity-100 hover:border-practice-amber hover:-translate-y-1 hover:shadow-dashboard">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-practice-line text-3xl text-practice-subdued">
        lock
      </div>
      <h3 className="text-xl font-bold text-practice-subdued">Premium Tests</h3>
      <p className="mb-6 mt-2 text-sm text-practice-subdued">
        Unlock 50+ advanced company mock tests
      </p>
      <button className="rounded bg-practice-amberDark px-6 py-2.5 text-sm font-extrabold text-white transition-all duration-200 hover:bg-practice-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-offset-2 focus-visible:ring-offset-white">
        Upgrade Now
      </button>
    </article>
  );
}

function PracticeTestCard({ test }: PracticeTestCardProps) {
  if (test.isPremium) {
    return <PremiumCard />;
  }

  return (
    <article className="group flex min-h-[230px] flex-col overflow-hidden rounded-lg border border-practice-line bg-white shadow-dashboard transition-all duration-300 ease-out hover:-translate-y-1 hover:border-practice-amber hover:shadow-lg">
      <div className="flex-1 p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="rounded-full bg-practice-muted px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-practice-subdued">
            {test.category}
          </span>
          <span
            className={[
              "rounded-full px-3 py-1 text-[11px] font-extrabold",
              statusClasses[test.status],
            ].join(" ")}
          >
            {test.status}
          </span>
        </div>

        <h3 className="mb-4 text-xl font-bold leading-snug text-practice-ink">
          {test.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-[#2d2f34]">
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-black text-practice-subdued">Q</span>
            {test.questions} Qs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-black text-practice-subdued">M</span>
            {test.duration} Mins
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-black text-practice-subdued">L</span>
            <span className={difficultyClasses[test.difficulty]}>{test.difficulty}</span>
          </span>
        </div>
      </div>

      <div className="border-t border-practice-line bg-practice-muted/40 p-4">
        <Link
          to={
            test.status === "Completed"
              ? "/practice-tests/results"
              : test.status === "In Progress"
                ? "/practice-tests/live"
                : "/practice-tests/selection"
          }
          state={{ testId: test.id, title: test.title, category: test.category }}
          className="block w-full rounded bg-practice-ink py-3 text-center text-sm font-extrabold text-white transition-all duration-200 hover:bg-practice-sidebarActive active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-practice-amber focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {getButtonText(test.status)}
        </Link>
      </div>
    </article>
  );
}

export default PracticeTestCard;
