import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppData } from "../../app/AppDataProvider";
import { BUDGET_CATEGORIES, type BudgetCategory } from "./budgetConstants";
import { loadBudgetPeriod, loadCategoryMappings, recommendedGoals, saveBudgetPeriod } from "./budgetStorage";
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
  const [overriddenGoals, setOverriddenGoals] = useState<BudgetCategory[]>(() => loadBudgetPeriod(year, month).overriddenGoals);
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
    const storedPeriod = loadBudgetPeriod(year, month);
    const nextIncome = storedPeriod.incomeOverride ?? calculateIncome(transactions, month, year);
    const period = loadBudgetPeriod(year, month, nextIncome);
    setGoals(period.goals);
    setOverriddenGoals(period.overriddenGoals);
    setIncome(nextIncome);
    setSavedIncome(nextIncome);
    setLastSavedAt(period.updatedAt);
    setDirty(false);
    setSaveStatus("idle");
    loadedPeriodRef.current = `${year}-${month}`;
  }, [month, transactions, year]);

  const persist = useCallback(
    (nextGoals = goals, nextIncome = savedIncome, nextOverriddenGoals = overriddenGoals) => {
      setSaveStatus("saving");
      try {
        const updatedAt = new Date().toISOString();
        saveBudgetPeriod(year, month, {
          incomeOverride: nextIncome,
          goals: nextGoals,
          overriddenGoals: nextOverriddenGoals,
          updatedAt,
        });
        setLastSavedAt(updatedAt);
        setSaveStatus("saved");
        setDirty(false);
      } catch {
        setSaveStatus("error");
      }
    },
    [goals, month, overriddenGoals, savedIncome, year],
  );

  useEffect(() => {
    if (!dirty || loadedPeriodRef.current !== `${year}-${month}`) return;
    const timer = window.setTimeout(() => persist(), 1500);
    return () => window.clearTimeout(timer);
  }, [dirty, month, persist, year]);

  const setGoal = (category: BudgetCategory, value: string) => {
    setGoals((current) => ({ ...current, [category]: value }));
    setOverriddenGoals((current) => current.includes(category) ? current : [...current, category]);
    setDirty(true);
    setSaveStatus("idle");
  };

  const saveIncome = (nextIncome: number) => {
    const normalized = Math.max(0, Math.round(nextIncome * 100) / 100);
    const defaults = recommendedGoals(normalized);
    const nextGoals = { ...goals };
    BUDGET_CATEGORIES.forEach((category) => {
      if (!overriddenGoals.includes(category)) nextGoals[category] = defaults[category];
    });
    setIncome(normalized);
    setSavedIncome(normalized);
    setGoals(nextGoals);
    persist(nextGoals, normalized, overriddenGoals);
  };

  const resetGoalToRecommended = (category: BudgetCategory) => {
    const nextOverriddenGoals = overriddenGoals.filter((item) => item !== category);
    const nextGoals = { ...goals, [category]: recommendedGoals(income)[category] };
    setOverriddenGoals(nextOverriddenGoals);
    setGoals(nextGoals);
    setDirty(true);
    setSaveStatus("idle");
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
    overriddenGoals,
    numericGoals,
    actuals,
    lastSavedAt,
    saveStatus,
    setMonth,
    setYear,
    setIncome,
    setGoal,
    resetGoalToRecommended,
    saveIncome,
    navigateMonth,
    save: () => persist(),
    totalGoal: BUDGET_CATEGORIES.reduce((total, category) => total + numericGoals[category], 0),
  };
}

export type BudgetController = ReturnType<typeof useBudget>;
