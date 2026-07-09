import type { PracticeTestCardData } from "../types/practiceTest";
import type {
  AnswerReviewRow,
  LiveQuestion,
  ResultBreakdown,
  SelectionItem,
  TestSummary,
} from "../types/testFlow";
import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
if (!API_BASE_URL) {
  throw new Error("Missing required API configuration: VITE_API_BASE_URL");
}

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

export interface RunCodeResponse {
  status: "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "COMPILE_ERROR" | "TIMEOUT" | "NO_TESTS";
  stdout: string;
  stderr: string;
  testsPassed: number;
  totalTests: number;
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
api.getSubjects = () => api<{ subjects: SelectionItem[] }>("/api/practice-tests/subjects");
api.getTopics = (subjectId?: string) =>
  api<{ topics: SelectionItem[] }>(
    subjectId ? `/api/practice-tests/topics?subject_id=${subjectId}` : "/api/practice-tests/topics"
  );
api.getSubtopics = (topicId?: string) =>
  api<{ subtopics: SelectionItem[] }>(
    topicId ? `/api/practice-tests/subtopics?topic_id=${topicId}` : "/api/practice-tests/subtopics"
  );

api.getRecommendations = () =>
  api<{ recommendations: Recommendation[] }>("/api/users/me/recommendations");

api.getWeakAreas = () =>
  api<{ weakAreas: WeakArea[] }>("/api/users/me/weak-areas");

api.startAttempt = (
  testId: string,
  subjectId: string,
  topicId: string,
  subtopicId: string
) => {
  return api<TestAttempt>("/api/test-attempts", {
    method: "POST",
    body: JSON.stringify({
      testId,
      subjectId,
      topicId,
      subtopicId,
    }),
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

api.runCode = (problemId: string, code: string) =>
  api<RunCodeResponse>("/api/coding/run", {
    method: "POST",
    body: JSON.stringify({ problemId, code }),
  });

api.submitCode = (problemId: string, code: string) =>
  api<RunCodeResponse & { submissionId: string | null }>("/api/coding/submit", {
    method: "POST",
    body: JSON.stringify({ problemId, code }),
  });

api.getCodingSubmissions = (problemId?: string) =>
  api<{
    submissions: Array<{
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
    }>;
  }>(
    `/api/coding/submissions${problemId ? `?problem_id=${problemId}` : ""}`
  );
