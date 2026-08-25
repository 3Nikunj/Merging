import { baseApi } from "./base";
import type { PracticeTestCardData } from "../../types/practiceTest";
import type {
  AnswerReviewRow,
  LiveQuestion,
  ResultBreakdown,
  SelectionItem,
  TestSummary,
} from "../../types/testFlow";

export interface PracticeTestsResponse {
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
  testTitle?: string;
  subjectTitle?: string;
  topicTitle?: string;
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

export const practiceApi = {
  getPracticeTests: () => baseApi<PracticeTestsResponse>("/api/practice-tests"),
  getSelectionData: () => baseApi<SelectionDataResponse>("/api/practice-tests/selection-data"),
  getSubjects: () => baseApi<{ subjects: SelectionItem[] }>("/api/practice-tests/subjects"),
  getTopics: (subjectId?: string) =>
    baseApi<{ topics: SelectionItem[] }>(
      subjectId ? `/api/practice-tests/topics?subject_id=${subjectId}` : "/api/practice-tests/topics"
    ),
  getSubtopics: (topicId?: string) =>
    baseApi<{ subtopics: SelectionItem[] }>(
      topicId ? `/api/practice-tests/subtopics?topic_id=${topicId}` : "/api/practice-tests/subtopics"
    ),
  getRecommendations: () =>
    baseApi<{ recommendations: Recommendation[] }>("/api/users/me/recommendations"),
  getWeakAreas: () =>
    baseApi<{ weakAreas: WeakArea[] }>("/api/users/me/weak-areas"),
  startAttempt: (
    testId: string,
    subjectId: string,
    topicId: string,
    subtopicId: string
  ) => {
    return baseApi<TestAttempt>("/api/test-attempts", {
      method: "POST",
      body: JSON.stringify({
        testId,
        subjectId,
        topicId,
        subtopicId,
      }),
    });
  },
  getAttemptQuestions: (attemptId: string, questionNumber?: number) =>
    baseApi<AttemptQuestionsResponse>(
      `/api/test-attempts/${attemptId}/questions${
        questionNumber ? `?question_number=${questionNumber}` : ""
      }`
    ),
  saveAnswer: (
    attemptId: string,
    questionId: number,
    optionId: string | null,
    status = "answered"
  ) =>
    baseApi<any>(`/api/test-attempts/${attemptId}/answers/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify({ optionId, status }),
    }),
  submitAttempt: (attemptId: string) =>
    baseApi<{ attemptId: string; status: string; resultUrl: string }>(
      `/api/test-attempts/${attemptId}/submit`,
      { method: "POST" }
    ),
  getAttemptResult: (attemptId: string) =>
    baseApi<AttemptResultResponse>(`/api/test-attempts/${attemptId}/result`),
};
