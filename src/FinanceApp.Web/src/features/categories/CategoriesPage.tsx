import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useAppData } from "../../app/AppDataProvider";
import { BUDGET_CATEGORIES, BUDGET_COLORS, type BudgetCategory } from "../budgets/budgetConstants";
import { defaultBudgetCategory, formatCurrency } from "../budgets/budgetUtils";
import { loadCategoryMappings, saveCategoryMapping } from "../budgets/budgetStorage";
import "./CategoriesPage.scss";

export default function CategoriesPage() {
  const { transactions, loading } = useAppData();
  const [mappings, setMappings] = useState(loadCategoryMappings);
  const categories = useMemo(() => {
    const grouped = new Map<string, { count: number; spend: number; detail: string | null }>();
    transactions.forEach((transaction) => {
      const key = transaction.plaidPrimaryCategory ?? "UNCATEGORIZED";
      const current = grouped.get(key) ?? { count: 0, spend: 0, detail: transaction.plaidDetailedCategory };
      current.count += 1;
      if (transaction.amount > 0) current.spend += transaction.amount;
      grouped.set(key, current);
    });
    return [...grouped.entries()]
      .map(([name, values]) => ({ name, ...values }))
      .sort((left, right) => right.count - left.count);
  }, [transactions]);

  const updateMapping = (plaidCategory: string, value: BudgetCategory | "Excluded") => {
    saveCategoryMapping(plaidCategory, value);
    setMappings((current) => ({ ...current, [plaidCategory]: value }));
  };

  return (
    <div className="page categories">
      <header className="page__header">
        <Box><span className="page__eyebrow">One rule, every month</span><Typography component="h1" className="page__title">Categories</Typography>
          <p className="page__subtitle">Plaid supplies the transaction category; you decide which of your five budget buckets it belongs to. The mapping applies automatically across every month.</p>
        </Box>
      </header>
      <Box className="categories__intro">
        <Card><CardContent>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <AutoAwesomeRounded color="secondary" />
            <Box><Typography variant="h6" fontWeight={750}>Automatic first pass</Typography>
              <Typography variant="body2" color="text.secondary" mt={.5}>Finances starts with transparent rules—for example, rent maps to Fixed Necessities and groceries map to Variable Necessities. Your overrides always win.</Typography></Box>
          </Stack>
        </CardContent></Card>
        <Card><CardContent>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <LockRounded color="secondary" />
            <Box><Typography variant="h6" fontWeight={750}>Private preferences</Typography>
              <Typography variant="body2" color="text.secondary" mt={.5}>Mappings are currently stored in this browser because the backend does not yet expose category-management endpoints.</Typography></Box>
          </Stack>
        </CardContent></Card>
      </Box>
      {categories.length === 0 && !loading ? (
        <Alert severity="info">Connect and sync a bank to discover Plaid categories.</Alert>
      ) : (
        <Paper variant="outlined" className="categories__list">
          <Box className="categories__list-header"><Typography fontWeight={750}>Plaid category</Typography><Typography fontWeight={750}>Activity</Typography><Typography fontWeight={750}>Budget Bucket</Typography></Box>
          {categories.map((category) => {
            const automatic = defaultBudgetCategory(category.name, category.detail);
            const selected = mappings[category.name] ?? automatic;
            return (
              <Box className="categories__row" key={category.name}>
                <Box>
                  <Typography fontWeight={700}>{category.name.replaceAll("_", " ")}</Typography>
                  <Typography variant="caption" color="text.secondary">{category.detail?.replaceAll("_", " ") ?? "No detailed category"}</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" label={`${category.count} transactions`} />
                  <Chip size="small" variant="outlined" label={formatCurrency(category.spend)} />
                </Stack>
                <TextField
                  select
                  label="Budget Bucket"
                  value={selected}
                  onChange={(event) => updateMapping(category.name, event.target.value as BudgetCategory | "Excluded")}
                  helperText={mappings[category.name] ? "Custom rule" : "Automatic rule"}
                >
                  <MenuItem value="Excluded">Excluded from budget</MenuItem>
                  {BUDGET_CATEGORIES.map((budgetCategory) => (
                    <MenuItem key={budgetCategory} value={budgetCategory}>
                      <span className="categories__dot" style={{ backgroundColor: BUDGET_COLORS[budgetCategory] }} />{budgetCategory}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            );
          })}
        </Paper>
      )}
    </div>
  );
}
