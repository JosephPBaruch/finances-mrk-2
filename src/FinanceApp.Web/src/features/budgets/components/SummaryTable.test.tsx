import { ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createAppTheme } from "../../../app/appTheme";
import { EMPTY_BUDGET_VALUES, type BudgetCategory } from "../budgetConstants";
import type { BudgetTotals } from "../budgetTypes";
import type { BudgetController } from "../useBudget";
import { SummaryTable } from "./SummaryTable";

const totals = (values: Partial<Record<BudgetCategory, number>>): BudgetTotals => ({
  "Fixed Necessities": 0,
  "Variable Necessities": 0,
  "Savings & Investing": 0,
  "Lifestyle & Fun": 0,
  "Irregular & Sinking Funds": 0,
  ...values,
});

const controller = (): BudgetController => ({
  month: 10,
  year: 2026,
  income: 1000,
  savedIncome: 1000,
  transactionIncome: 1000,
  previousIncome: 900,
  goals: { ...EMPTY_BUDGET_VALUES, "Fixed Necessities": "100", "Lifestyle & Fun": "100" },
  overriddenGoals: ["Fixed Necessities", "Lifestyle & Fun"],
  numericGoals: totals({ "Fixed Necessities": 100, "Lifestyle & Fun": 100 }),
  actuals: totals({ "Fixed Necessities": 80, "Lifestyle & Fun": 120 }),
  lastSavedAt: null,
  saveStatus: "idle",
  setMonth: vi.fn(),
  setYear: vi.fn(),
  setIncome: vi.fn(),
  setGoal: vi.fn(),
  resetGoalToRecommended: vi.fn(),
  saveIncome: vi.fn(),
  navigateMonth: vi.fn(),
  save: vi.fn(),
  totalGoal: 200,
});

describe("SummaryTable", () => {
  it("marks under-budget spending favorable and overspending unfavorable", () => {
    render(
      <ThemeProvider theme={createAppTheme("dark")}>
        <SummaryTable budget={controller()} periodLabel="October 2026" />
      </ThemeProvider>,
    );

    expect(screen.getByText("Fixed Necessities").closest("tr")).toHaveClass("budget-summary__row--favorable");
    expect(screen.getByText("Lifestyle & Fun").closest("tr")).toHaveClass("budget-summary__row--unfavorable");
  });
});
