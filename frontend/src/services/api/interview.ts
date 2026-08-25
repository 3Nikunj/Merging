import { baseApi, API_BASE_URL } from "./base";
import { supabase } from "../supabase";

export interface AiInterviewSession {
  id: string;
  studentId: string;
  mode: "jd_based" | "custom";
  company?: string;
  position?: string;
  experienceLevel?: string;
  interviewType?: string;
  difficulty?: string;
  status: "setup" | "active" | "completed" | "cancelled";
  voiceAccent?: string;
  overallScore?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AiInterviewAction {
  status: "active" | "completed";
  interviewerMessage: string;
  questionType?: string;
  score?: number;
  feedback?: string;
  rubric?: Record<string, number>;
  mistakes?: string[];
  missingKeywords?: string[];
  correctedAnswer?: string;
  followUpNeeded: boolean;
}

export interface AiInterviewTurn {
  id: string;
  sortOrder: number;
  question: string;
  questionType?: string;
  answerTranscript?: string;
  score?: number;
  rubric: Record<string, number>;
  mistakes: string[];
  missingKeywords: string[];
  correctedAnswer?: string;
  feedback?: string;
  followUpNeeded: boolean;
  createdAt: string;
}

export interface AiInterviewReport {
  sessionId: string;
  summary?: string;
  strengths: string[];
  weaknesses: string[];
  recommendedPractice: Array<{ topic: string; reason: string }>;
  dashboardMetrics: Record<string, number>;
  turns: AiInterviewTurn[];
  overallScore?: number;
}

export interface AiInterviewHistoryItem {
  id: string;
  mode: "jd_based" | "custom";
  company?: string;
  position?: string;
  interviewType?: string;
  difficulty?: string;
  status: string;
  overallScore?: number;
  createdAt: string;
}

export interface AiInterviewSummary {
  averageScore: number;
  totalCompleted: number;
  weakestArea: string;
  strongestArea: string;
  recentScores: Array<{
    id: string;
    date: string;
    score: number;
    position: string;
    company: string;
  }>;
}

export const interviewApi = {
  extractResumeText: async (file: File): Promise<{ resume_text: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/ai-interviews/resume/extract`, {
      method: "POST",
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("user_role");
        supabase.auth.signOut().catch(() => {});
        window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
      }
      let message = `Request failed: ${response.status}`;
      try {
        const errorBody = await response.json();
        message = errorBody?.detail || message;
      } catch {
        // fall back to default error
      }
      throw new Error(message);
    }

    return response.json();
  },

  createInterviewSession: (payload: {
    mode: "jd_based" | "custom";
    company?: string;
    position?: string;
    experience_level?: string;
    interview_type?: string;
    difficulty?: string;
    jd_text?: string;
    resume_text?: string;
    voiceAccent?: string;
  }) =>
    baseApi<AiInterviewSession>("/api/ai-interviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  startInterviewSession: (sessionId: string) =>
    baseApi<AiInterviewAction>(`/api/ai-interviews/${sessionId}/start`, {
      method: "POST",
    }),

  submitInterviewAnswer: (sessionId: string, answerTranscript: string) =>
    baseApi<AiInterviewAction>(`/api/ai-interviews/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ answerTranscript }),
    }),

  skipInterviewQuestion: (sessionId: string) =>
    baseApi<AiInterviewAction>(`/api/ai-interviews/${sessionId}/skip`, {
      method: "POST",
    }),

  completeInterviewSession: (sessionId: string) =>
    baseApi<AiInterviewAction>(`/api/ai-interviews/${sessionId}/complete`, {
      method: "POST",
    }),

  getInterviewReport: (sessionId: string) =>
    baseApi<AiInterviewReport>(`/api/ai-interviews/${sessionId}/report`),

  getInterviewHistory: () =>
    baseApi<AiInterviewHistoryItem[]>("/api/ai-interviews/history"),

  getInterviewSummary: () =>
    baseApi<AiInterviewSummary>("/api/ai-interviews/summary"),

  getInterviewWebSocketUrl: (sessionId: string, token: string) => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const cleanBase = API_BASE_URL!.replace(/^https?:\/\//, "");
    return `${wsProtocol}//${cleanBase}/api/ai-interviews/ws/${sessionId}?token=${token}`;
  },
};
