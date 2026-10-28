import type { FinanceTransaction } from "../../shared/api/apiTypes";

export type ConfidenceFilter = "all" | "needs-category" | "unreviewed" | "high-confidence";

export function needsCategoryReview(transaction: FinanceTransaction): boolean {
  const confidence = transaction.plaidCategoryConfidence?.toUpperCase();
  return !transaction.isReviewed && !transaction.userCategoryId
    && (!confidence || confidence === "LOW" || confidence === "UNKNOWN");
}

export function matchesConfidenceFilter(transaction: FinanceTransaction, filter: ConfidenceFilter): boolean {
  if (filter === "needs-category") return needsCategoryReview(transaction);
  if (filter === "unreviewed") return !transaction.isReviewed;
  if (filter === "high-confidence") return ["HIGH", "VERY_HIGH"].includes(transaction.plaidCategoryConfidence?.toUpperCase() ?? "");
  return true;
}
