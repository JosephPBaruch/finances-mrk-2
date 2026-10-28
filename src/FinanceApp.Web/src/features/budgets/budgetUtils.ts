import type { FinanceTransaction } from "../../shared/api/apiTypes";
import {
  BUDGET_CATEGORIES,
  EMPTY_BUDGET_VALUES,
  RECOMMENDED_PERCENTAGES,
  SAVINGS_CATEGORIES,
  type BudgetCategory,
} from "./budgetConstants";
import type { BudgetComparisonStatus, BudgetTotals, BudgetValues, CategoryMappings } from "./budgetTypes";

export function parseAmount(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number, signed = false): string {
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(value));
  if (!signed || value === 0) return formatted;
  return `${value > 0 ? "+" : "−"}${formatted}`;
}

export function toBudgetValues(values: Partial<Record<BudgetCategory, string>>): BudgetValues {
  return { ...EMPTY_BUDGET_VALUES, ...values };
}

export function defaultBudgetCategory(primary: string | null, detailed: string | null): BudgetCategory | "Excluded" {
  const normalizedPrimary = primary?.toUpperCase() ?? "";
  const normalizedDetailed = detailed?.toUpperCase() ?? "";

  if (normalizedPrimary === "INCOME" || normalizedPrimary === "TRANSFER_IN") return "Excluded";
  if (normalizedPrimary === "TRANSFER_OUT") return "Savings & Investing";
  if (["RENT_AND_UTILITIES", "LOAN_PAYMENTS", "GOVERNMENT_AND_NON_PROFIT"].includes(normalizedPrimary))
    return "Fixed Necessities";
  if (["TRANSPORTATION", "MEDICAL"].includes(normalizedPrimary) || normalizedDetailed.includes("GROCERIES"))
    return "Variable Necessities";
  if (["BANK_FEES", "HOME_IMPROVEMENT"].includes(normalizedPrimary)) return "Irregular & Sinking Funds";
  return "Lifestyle & Fun";
}

export function resolveBudgetCategory(
  transaction: FinanceTransaction,
  mappings: CategoryMappings,
): BudgetCategory | "Excluded" {
  if (transaction.userCategoryId) {
    if (transaction.userCategoryBudgetBucket && BUDGET_CATEGORIES.includes(transaction.userCategoryBudgetBucket as BudgetCategory)) {
      return transaction.userCategoryBudgetBucket as BudgetCategory;
    }
    return "Excluded";
  }
  const primary = transaction.plaidPrimaryCategory ?? "UNCATEGORIZED";
  return mappings[primary] ?? defaultBudgetCategory(primary, transaction.plaidDetailedCategory);
}

export function isInPeriod(date: string, month: number, year: number): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match !== null && Number(match[1]) === year && Number(match[2]) === month;
}

export function calculateIncome(transactions: FinanceTransaction[], month: number, year: number): number {
  const income = transactions
    .filter((transaction) => isInPeriod(transaction.date, month, year) && transaction.amount < 0)
    .filter((transaction) => transaction.userCategoryName === "Income"
      || ["INCOME", "TRANSFER_IN"].includes(transaction.plaidPrimaryCategory?.toUpperCase() ?? ""))
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  return Math.round(income * 100) / 100;
}

export function calculateActuals(
  transactions: FinanceTransaction[],
  month: number,
  year: number,
  mappings: CategoryMappings,
): BudgetTotals {
  const totals = Object.fromEntries(BUDGET_CATEGORIES.map((category) => [category, 0])) as BudgetTotals;
  transactions
    .filter((transaction) => isInPeriod(transaction.date, month, year) && transaction.amount > 0)
    .forEach((transaction) => {
      const category = resolveBudgetCategory(transaction, mappings);
      if (category !== "Excluded") totals[category] += transaction.amount;
    });
  BUDGET_CATEGORIES.forEach((category) => {
    totals[category] = Math.round(totals[category] * 100) / 100;
  });
  return totals;
}

export function goalTotals(values: BudgetValues): BudgetTotals {
  return Object.fromEntries(
    BUDGET_CATEGORIES.map((category) => [category, Math.max(0, parseAmount(values[category]))]),
  ) as BudgetTotals;
}

export function recommendationStatus(category: BudgetCategory, percentage: number): BudgetComparisonStatus {
  if (!Number.isFinite(percentage)) return "neutral";
  const recommendation = RECOMMENDED_PERCENTAGES[category];
  const favorable = SAVINGS_CATEGORIES.has(category)
    ? percentage >= recommendation
    : percentage <= recommendation;
  return favorable ? "favorable" : "unfavorable";
}

export function spendingStatus(category: BudgetCategory, goal: number, actual: number): BudgetComparisonStatus {
  if (goal <= 0) return "neutral";
  const favorable = SAVINGS_CATEGORIES.has(category) ? actual >= goal : actual <= goal;
  return favorable ? "favorable" : "unfavorable";
}

export function totalOutflowStatus(income: number, actual: number): BudgetComparisonStatus {
  if (income <= 0) return "neutral";
  const percentage = (actual / income) * 100;
  return percentage >= 98 && percentage <= 102 ? "favorable" : "unfavorable";
}

export function previousPeriod(month: number, year: number): { month: number; year: number } {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

export function relativeSavedAt(iso: string | null, now = Date.now()): string {
  if (!iso) return "Not saved yet";
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
