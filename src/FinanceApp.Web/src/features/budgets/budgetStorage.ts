import { readJson, writeJson } from "../../shared/storage/jsonStorage";
import { BUDGET_CATEGORIES, EMPTY_BUDGET_VALUES, RECOMMENDED_PERCENTAGES, type BudgetCategory } from "./budgetConstants";
import type { BudgetPeriodData, CategoryMappings } from "./budgetTypes";

const PERIOD_STORAGE_KEY = "financeBudgetPeriods";
const MAPPING_STORAGE_KEY = "financePlaidCategoryMappings";

type StoredPeriod = Partial<Omit<BudgetPeriodData, "goals">> & { goals?: Partial<BudgetPeriodData["goals"]> };
type StoredPeriods = Record<string, StoredPeriod>;

export function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function recommendedGoals(income: number): BudgetPeriodData["goals"] {
  return Object.fromEntries(BUDGET_CATEGORIES.map((category) => [
    category,
    ((Math.max(0, income) * RECOMMENDED_PERCENTAGES[category]) / 100).toFixed(2),
  ])) as BudgetPeriodData["goals"];
}

export function loadBudgetPeriod(year: number, month: number, income = 0): BudgetPeriodData {
  const periods = readJson<StoredPeriods>(PERIOD_STORAGE_KEY, {});
  const stored = periods[periodKey(year, month)];
  const overriddenGoals = stored?.overriddenGoals
    ?? (stored?.goals ? Object.keys(stored.goals) as BudgetCategory[] : []);
  const defaults = recommendedGoals(income);
  const goals = { ...defaults };
  overriddenGoals.forEach((category) => {
    goals[category] = stored?.goals?.[category] ?? EMPTY_BUDGET_VALUES[category];
  });
  return {
    incomeOverride: stored?.incomeOverride ?? null,
    goals,
    overriddenGoals,
    updatedAt: stored?.updatedAt ?? null,
  };
}

export function saveBudgetPeriod(year: number, month: number, period: BudgetPeriodData): void {
  const periods = readJson<StoredPeriods>(PERIOD_STORAGE_KEY, {});
  periods[periodKey(year, month)] = period;
  writeJson(PERIOD_STORAGE_KEY, periods);
}

export function loadCategoryMappings(): CategoryMappings {
  return readJson<CategoryMappings>(MAPPING_STORAGE_KEY, {});
}

export function saveCategoryMapping(plaidCategory: string, budgetCategory: BudgetCategory | "Excluded"): void {
  const mappings = loadCategoryMappings();
  mappings[plaidCategory] = budgetCategory;
  writeJson(MAPPING_STORAGE_KEY, mappings);
}
