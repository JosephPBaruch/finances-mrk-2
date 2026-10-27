import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppData } from "../../app/AppDataProvider";
import { BUDGET_CATEGORIES, type BudgetCategory } from "./budgetConstants";
import { loadBudgetPeriod, loadCategoryMappings, saveBudgetPeriod } from "./budgetStorage";
import type { BudgetValues } from "./budgetTypes";
import { calculateActuals, calculateIncome, goalTotals, previousPeriod } from "./budgetUtils";

export function useBudget() {
  const today = new Date();
  const { transactions } = useAppData();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [income, setIncome] = useState(0);
  const [savedIncome, setSavedIncome] = useState(0);
  const [goals, setGoals] = useState<BudgetValues>(() => loadBudgetPeriod(year, month).goals);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dirty, setDirty] = useState(false);
  const loadedPeriodRef = useRef("");
  const mappings = loadCategoryMappings();
  const transactionIncome = useMemo(() => calculateIncome(transactions, month, year), [transactions, month, year]);
  const actuals = useMemo(
    () => calculateActuals(transactions, month, year, mappings),
    [transactions, month, year, mappings],
  );
  const numericGoals = useMemo(() => goalTotals(goals), [goals]);

  useEffect(() => {
    const period = loadBudgetPeriod(year, month);
    const nextIncome = period.incomeOverride ?? calculateIncome(transactions, month, year);
    setGoals(period.goals);
    setIncome(nextIncome);
    setSavedIncome(nextIncome);
    setLastSavedAt(period.updatedAt);
    setDirty(false);
    setSaveStatus("idle");
    loadedPeriodRef.current = `${year}-${month}`;
  }, [month, transactions, year]);

  const persist = useCallback(
    (nextGoals = goals, nextIncome = savedIncome) => {
      setSaveStatus("saving");
      try {
        const updatedAt = new Date().toISOString();
        saveBudgetPeriod(year, month, {
          incomeOverride: nextIncome,
          goals: nextGoals,
          updatedAt,
        });
        setLastSavedAt(updatedAt);
        setSaveStatus("saved");
        setDirty(false);
      } catch {
        setSaveStatus("error");
      }
    },
    [goals, month, savedIncome, year],
  );

  useEffect(() => {
    if (!dirty || loadedPeriodRef.current !== `${year}-${month}`) return;
    const timer = window.setTimeout(() => persist(), 1500);
    return () => window.clearTimeout(timer);
  }, [dirty, month, persist, year]);

  const setGoal = (category: BudgetCategory, value: string) => {
    setGoals((current) => ({ ...current, [category]: value }));
    setDirty(true);
    setSaveStatus("idle");
  };

  const saveIncome = (nextIncome: number) => {
    const normalized = Math.max(0, Math.round(nextIncome * 100) / 100);
    setIncome(normalized);
    setSavedIncome(normalized);
    persist(goals, normalized);
  };

  const navigateMonth = (direction: -1 | 1) => {
    const date = new Date(year, month - 1 + direction, 1);
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  };

  const previous = previousPeriod(month, year);
  const previousIncome = loadBudgetPeriod(previous.year, previous.month).incomeOverride;

  return {
    month,
    year,
    income,
    savedIncome,
    transactionIncome,
    previousIncome,
    goals,
    numericGoals,
    actuals,
    lastSavedAt,
    saveStatus,
    setMonth,
    setYear,
    setIncome,
    setGoal,
    saveIncome,
    navigateMonth,
    save: () => persist(),
    totalGoal: BUDGET_CATEGORIES.reduce((total, category) => total + numericGoals[category], 0),
  };
}

export type BudgetController = ReturnType<typeof useBudget>;
