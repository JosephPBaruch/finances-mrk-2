import type { UserCategory } from "../../shared/api/apiTypes";
import { apiRequest } from "../../shared/api/http";

export const categoryApi = {
  getAll: () => apiRequest<UserCategory[]>("/categories"),
};
