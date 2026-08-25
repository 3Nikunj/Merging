import { supabase } from "../supabase";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
if (!API_BASE_URL) {
  throw new Error("Missing required API configuration: VITE_API_BASE_URL");
}

export async function baseApi<T>(path: string, init?: RequestInit): Promise<T> {
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
    if (response.status === 401) {
      localStorage.removeItem("user_role");
      supabase.auth.signOut().catch(() => {});
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
