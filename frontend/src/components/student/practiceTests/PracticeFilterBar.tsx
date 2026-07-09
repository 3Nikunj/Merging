import { Search } from "lucide-react";
import type { PracticeTestCardData } from "../../../types/practiceTest";

interface PracticeFilterBarProps {
  searchTerm: string;
  subject: string;
  difficulty: string;
  status: string;
  subjects: string[];
  onSearchTermChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onDifficultyChange: (value: PracticeTestCardData["difficulty"] | "All") => void;
  onStatusChange: (value: PracticeTestCardData["status"] | "All") => void;
}

function PracticeFilterBar({
  searchTerm,
  subject,
  difficulty,
  status,
  subjects,
  onSearchTermChange,
  onSubjectChange,
  onDifficultyChange,
  onStatusChange,
}: PracticeFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-practice-line bg-white p-4 shadow-dashboard">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-practice-subdued" aria-hidden="true" />
        <input
          className="w-full rounded border border-practice-line bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-practice-subdued/70 focus:border-practice-ink focus:ring-2 focus:ring-practice-ink/10"
          placeholder="Search by title..."
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
      </div>

      <select
        className="min-w-[150px] rounded border border-practice-line bg-white px-4 py-2.5 text-sm text-practice-text outline-none transition focus:border-practice-ink focus:ring-2 focus:ring-practice-ink/10"
        value={subject}
        onChange={(event) => onSubjectChange(event.target.value)}
      >
        <option value="All">All Subjects</option>
        {subjects.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        className="min-w-[140px] rounded border border-practice-line bg-white px-4 py-2.5 text-sm text-practice-text outline-none transition focus:border-practice-ink focus:ring-2 focus:ring-practice-ink/10"
        value={difficulty}
        onChange={(event) =>
          onDifficultyChange(event.target.value as PracticeTestCardData["difficulty"] | "All")
        }
      >
        <option value="All">Difficulty</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>

      <select
        className="min-w-[140px] rounded border border-practice-line bg-white px-4 py-2.5 text-sm text-practice-text outline-none transition focus:border-practice-ink focus:ring-2 focus:ring-practice-ink/10"
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as PracticeTestCardData["status"] | "All")
        }
      >
        <option value="All">Status</option>
        <option value="Not Started">Not Started</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>
    </div>
  );
}

export default PracticeFilterBar;
