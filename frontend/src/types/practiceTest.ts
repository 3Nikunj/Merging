export interface PracticeTestCardData {
  id: string;
  title: string;
  category: string;
  status: "Not Started" | "In Progress" | "Completed";
  questions: number;
  duration: number;
  difficulty: "Easy" | "Medium" | "Hard";
  isPremium?: boolean;
}
