export const BUDGET_CATEGORIES = [
  "Fixed Necessities",
  "Variable Necessities",
  "Savings & Investing",
  "Lifestyle & Fun",
  "Irregular & Sinking Funds",
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const RECOMMENDED_PERCENTAGES: Record<BudgetCategory, number> = {
  "Fixed Necessities": 35,
  "Variable Necessities": 15,
  "Savings & Investing": 15,
  "Lifestyle & Fun": 30,
  "Irregular & Sinking Funds": 5,
};

export const SAVINGS_CATEGORIES = new Set<BudgetCategory>([
  "Savings & Investing",
  "Irregular & Sinking Funds",
]);

export const BUDGET_COLORS: Record<BudgetCategory, string> = {
  "Fixed Necessities": "#75B89F",
  "Variable Necessities": "#88A9BD",
  "Savings & Investing": "#A9BC8F",
  "Lifestyle & Fun": "#D9A96C",
  "Irregular & Sinking Funds": "#CF8E76",
};

export const EMPTY_BUDGET_VALUES: Record<BudgetCategory, string> = {
  "Fixed Necessities": "0",
  "Variable Necessities": "0",
  "Savings & Investing": "0",
  "Lifestyle & Fun": "0",
  "Irregular & Sinking Funds": "0",
};
