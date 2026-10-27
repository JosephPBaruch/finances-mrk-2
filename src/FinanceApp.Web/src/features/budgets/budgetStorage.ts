import { readJson, writeJson } from "../../shared/storage/jsonStorage";
import { EMPTY_BUDGET_VALUES, type BudgetCategory } from "./budgetConstants";
import type { BudgetPeriodData, CategoryMappings } from "./budgetTypes";

const PERIOD_STORAGE_KEY = "financeBudgetPeriods";
const MAPPING_STORAGE_KEY = "financePlaidCategoryMappings";

type StoredPeriods = Record<string, BudgetPeriodData>;

export function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function loadBudgetPeriod(year: number, month: number): BudgetPeriodData {
  const periods = readJson<StoredPeriods>(PERIOD_STORAGE_KEY, {});
  const stored = periods[periodKey(year, month)];
  return {
    incomeOverride: stored?.incomeOverride ?? null,
    goals: { ...EMPTY_BUDGET_VALUES, ...stored?.goals },
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
