import type { PracticeTestCardData } from "../types/practiceTest";
import type {
  AnswerReviewRow,
  LiveQuestion,
  ResultBreakdown,
  SelectionItem,
  TestSummary,
} from "../types/testFlow";
import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

interface PracticeTestsResponse {
  tests: PracticeTestCardData[];
}

export interface SelectionDataResponse {
  subjects: SelectionItem[];
  topics: SelectionItem[];
  subtopics: SelectionItem[];
  selectedTest: TestSummary;
}

export interface Recommendation {
  label: string;
  title: string;
  description: string;
}

export interface WeakArea {
  topic: string;
  accuracy: number;
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  status: "IN_PROGRESS" | "SUBMITTED";
  currentQuestion: number;
  answeredCount: number;
}

export interface AttemptQuestionsResponse {
  attempt: TestAttempt;
  question: LiveQuestion;
  totalQuestions: number;
  markedQuestions: number[];
}

export interface AttemptResultResponse {
  attemptId: string;
  title: string;
  overallScore: number;
  correct: number;
  incorrect: number;
  skipped: number;
  timeTaken: string;
  percentile: string;
  breakdown: ResultBreakdown[];
  answerReview: AnswerReviewRow[];
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(init?.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Student Portal Specific Methods
api.getPracticeTests = () => api<PracticeTestsResponse>("/api/practice-tests");
api.getSelectionData = () => api<SelectionDataResponse>("/api/practice-tests/selection-data");

api.getRecommendations = (userId: string) =>
  api<{ recommendations: Recommendation[] }>(`/api/users/${userId}/recommendations`);

api.getWeakAreas = (userId: string) =>
  api<{ weakAreas: WeakArea[] }>(`/api/users/${userId}/weak-areas`);

api.startAttempt = () => {
  // dynamic check if auth user is logged in
  return supabase.auth.getUser().then(({ data: { user } }) => {
    return api<TestAttempt>("/api/test-attempts", {
      method: "POST",
      body: JSON.stringify({
        userId: user?.id || "demo-user",
        testId: "prime-factors",
        subjectId: "quant",
        topicId: "number-systems",
        subtopicId: "prime-factors",
      }),
    });
  });
};

api.getAttemptQuestions = (attemptId: string, questionNumber?: number) =>
  api<AttemptQuestionsResponse>(
    `/api/test-attempts/${attemptId}/questions${
      questionNumber ? `?question_number=${questionNumber}` : ""
    }`
  );

api.saveAnswer = (
  attemptId: string,
  questionId: number,
  optionId: string | null,
  status = "answered"
) =>
  api(`/api/test-attempts/${attemptId}/answers/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify({ optionId, status }),
  });

api.submitAttempt = (attemptId: string) =>
  api<{ attemptId: string; status: string; resultUrl: string }>(
    `/api/test-attempts/${attemptId}/submit`,
    { method: "POST" }
  );

api.getAttemptResult = (attemptId: string) =>
  api<AttemptResultResponse>(`/api/test-attempts/${attemptId}/result`);
