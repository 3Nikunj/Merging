import { baseApi } from "./base";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "student" | "admin";
  phone: string | null;
  college: string | null;
  department: string | null;
  year_of_graduation: number | null;
  membership_type: string | null;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  skills: string | null;
  avatar_url: string | null;
  createdAt: string;
}

export interface UserAcademics {
  profile_id: string;
  tenth_percentage: number | null;
  twelfth_percentage: number | null;
  graduation_cgpa: number | null;
  backlogs: number;
  gap_years: number;
  gap_during_grad: boolean;
  updatedAt: string;
}

export interface UserProfileResponse {
  profile: UserProfile;
  academics: UserAcademics | null;
}

export interface UserProfileUpdate {
  full_name: string | null;
  phone: string | null;
  college: string | null;
  department: string | null;
  year_of_graduation: number | null;
  tenth_percentage: number | null;
  twelfth_percentage: number | null;
  graduation_cgpa: number | null;
  backlogs: number;
  gap_years: number;
  gap_during_grad: boolean;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  skills: string | null;
  avatar_url: string | null;
  membership_type: string | null;
}

export interface DashboardStats {
  averageTestScore: number;
  testsCompleted: number;
  codingSuccessRate: number;
  codingTotalSubmissions: number;
  interviewAverageScore: number;
  interviewCompletedCount: number;
  subjectMastery: Record<string, number>;
}

export const authApi = {
  getProfile: () => baseApi<UserProfileResponse>("/api/users/me/profile"),
  updateProfile: (payload: UserProfileUpdate) =>
    baseApi<UserProfileResponse>("/api/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getDashboardStats: () => baseApi<DashboardStats>("/api/users/me/dashboard-stats"),
};
