import type { BudgetCategory } from "./budgetConstants";

export type BudgetValues = Record<BudgetCategory, string>;
export type BudgetTotals = Record<BudgetCategory, number>;
export type BudgetComparisonStatus = "favorable" | "unfavorable" | "neutral";

export type BudgetPeriodData = {
  incomeOverride: number | null;
  goals: BudgetValues;
  updatedAt: string | null;
};

export type CategoryMappings = Record<string, BudgetCategory | "Excluded">;
