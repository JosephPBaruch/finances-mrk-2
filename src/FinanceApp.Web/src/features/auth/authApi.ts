import type { AuthStatus } from "../../shared/api/apiTypes";
import { apiRequest } from "../../shared/api/http";

export const authApi = {
  status: () => apiRequest<AuthStatus>("/auth/status"),
  setup: (password: string) => apiRequest<AuthStatus>("/auth/setup", { method: "POST", body: { password } }),
  login: (password: string) => apiRequest<AuthStatus>("/auth/login", { method: "POST", body: { password } }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
};
