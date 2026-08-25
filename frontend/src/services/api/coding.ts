import { baseApi } from "./base";

export interface RunCodeResponse {
  status: "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "COMPILE_ERROR" | "TIMEOUT" | "NO_TESTS";
  stdout: string;
  stderr: string;
  testsPassed: number;
  totalTests: number;
}

export interface CodingSubmission {
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
}

export const codingApi = {
  runCode: (problemId: string, code: string, language: string = "python3") =>
    baseApi<RunCodeResponse>("/api/coding/run", {
      method: "POST",
      body: JSON.stringify({ problemId, code, language }),
    }),
  submitCode: (problemId: string, code: string, language: string = "python3") =>
    baseApi<RunCodeResponse & { submissionId: string | null }>("/api/coding/submit", {
      method: "POST",
      body: JSON.stringify({ problemId, code, language }),
    }),
  getCodingSubmissions: (problemId?: string) =>
    baseApi<{ submissions: CodingSubmission[] }>(
      `/api/coding/submissions${problemId ? `?problem_id=${problemId}` : ""}`
    ),
};
