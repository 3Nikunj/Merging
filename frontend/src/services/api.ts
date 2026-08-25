import { baseApi } from "./api/base";
import { authApi } from "./api/auth";
import { practiceApi } from "./api/practice";
import { codingApi } from "./api/coding";
import { interviewApi } from "./api/interview";

// Re-export sub-module APIs to allow segregated imports (ISP compliant!)
export { authApi } from "./api/auth";
export { practiceApi } from "./api/practice";
export { codingApi } from "./api/coding";
export { interviewApi } from "./api/interview";

// Re-export type definitions
export type { UserProfile, UserAcademics, UserProfileResponse, UserProfileUpdate, DashboardStats } from "./api/auth";
export type { TestAttempt, AttemptQuestionsResponse, AttemptResultResponse, Recommendation, WeakArea } from "./api/practice";
export type { RunCodeResponse, CodingSubmission } from "./api/coding";
export type { AiInterviewSession, AiInterviewAction, AiInterviewTurn, AiInterviewReport, AiInterviewHistoryItem, AiInterviewSummary } from "./api/interview";

// Construct backward-compatible monolithic API object
export const api = Object.assign(
  async function <T>(path: string, init?: RequestInit): Promise<T> {
    return baseApi<T>(path, init);
  },
  {
    ...authApi,
    ...practiceApi,
    ...codingApi,
    ...interviewApi,
    
    getCompanySimulationQuestions: (companyId: string, roundType: string, difficulty?: string) => {
      let url = `/api/company-simulation/questions?company_id=${companyId}&round_type=${roundType}`;
      if (difficulty) {
        url += `&difficulty=${difficulty}`;
      }
      return baseApi<{ questions: any[] }>(url);
    },
    
    getCompanies: () => baseApi<{ items: { id: string; name: string }[] }>("/admin/companies"),
    createCompany: (name: string) => baseApi<{ id: string; name: string }>("/admin/companies", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  }
);
