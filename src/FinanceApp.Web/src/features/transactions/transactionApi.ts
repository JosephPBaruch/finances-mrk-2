import type { FinanceTransaction, PagedResponse } from "../../shared/api/apiTypes";
import { apiRequest } from "../../shared/api/http";

export type TransactionQuery = {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  isReviewed?: boolean;
  pending?: boolean;
  page?: number;
  pageSize?: number;
};

function toQueryString(query: TransactionQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export const transactionApi = {
  getPage: (query: TransactionQuery = {}) =>
    apiRequest<PagedResponse<FinanceTransaction>>(`/transactions${toQueryString(query)}`),

  async getAll(): Promise<FinanceTransaction[]> {
    const first = await this.getPage({ page: 1, pageSize: 200 });
    if (first.totalPages <= 1) return first.items;
    const remaining = await Promise.all(
      Array.from({ length: first.totalPages - 1 }, (_, index) =>
        this.getPage({ page: index + 2, pageSize: 200 }),
      ),
    );
    return [first, ...remaining].flatMap((page) => page.items);
  },

  update: (transactionId: string, values: { isReviewed?: boolean; notes?: string | null }) =>
    apiRequest<FinanceTransaction>(`/transactions/${transactionId}`, {
      method: "PATCH",
      body: values,
    }),
};
