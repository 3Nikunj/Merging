export interface SelectionItem {
  id: string;
  title: string;
  progress: number;
  average: string;
  questions: number;
  badge?: string;
}

export interface TestSummary {
  subject: string;
  topic: string;
  subtopic: string;
  title: string;
  questions: number;
  duration: number;
  totalMarks: number;
  difficulty: "Easy" | "Medium" | "Hard";
  passingScore: string;
  attemptsAllowed: number;
  bestScore: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface LiveQuestion {
  id: number;
  points: number;
  text: string;
  options: QuestionOption[];
  answerId?: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  language: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string[];
  tags: string[];
  starterCode: string[];
}

export interface ResultBreakdown {
  label: string;
  score: number;
}

export interface AnswerReviewRow {
  id: string;
  preview: string;
  status: "Correct" | "Incorrect" | "Skipped";
  topic: string;
}
