import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import AccountTreeRounded from "@mui/icons-material/AccountTreeRounded";
import {
  Alert, Box, Card, CardContent, Chip, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useAppData } from "../../app/AppDataProvider";
import { useNotification } from "../../shared/notifications/NotificationProvider";
import { BUDGET_CATEGORIES, BUDGET_COLORS, type BudgetCategory } from "../budgets/budgetConstants";
import { formatCurrency } from "../budgets/budgetUtils";
import { categoryApi } from "./categoryApi";
import "./CategoriesPage.scss";

export default function CategoriesPage() {
  const { categories, transactions, loading, refresh } = useAppData();
  const { notify } = useNotification();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const activity = useMemo(() => new Map(categories.map((category) => {
    const assigned = transactions.filter((transaction) => transaction.userCategoryId === category.categoryId);
    return [category.categoryId, {
      count: assigned.length,
      total: assigned.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0),
    }];
  })), [categories, transactions]);

  const updateBudgetBucket = async (categoryId: string, budgetBucket: string) => {
    setUpdatingId(categoryId);
    try {
      await categoryApi.update(categoryId, budgetBucket || null);
      await refresh();
      notify("Category budget treatment updated.", "success");
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to update the category.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page categories">
      <header className="page__header">
        <Box>
          <span className="page__eyebrow">Categories first, budget second</span>
          <Typography component="h1" className="page__title">Categories</Typography>
          <p className="page__subtitle">Correct transactions into meaningful categories such as Groceries or Dining. Each category then controls which budget bucket receives the spending.</p>
        </Box>
      </header>
      <Box className="categories__intro">
        <Card><CardContent>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <AutoAwesomeRounded color="secondary" />
            <Box><Typography variant="h6" fontWeight={750}>Plaid stays the default</Typography>
              <Typography variant="body2" color="text.secondary" mt={.5}>You can accept Plaid’s category directly or correct an uncertain transaction into one of these categories.</Typography></Box>
          </Stack>
        </CardContent></Card>
        <Card><CardContent>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <AccountTreeRounded color="secondary" />
            <Box><Typography variant="h6" fontWeight={750}>Clear budget mapping</Typography>
              <Typography variant="body2" color="text.secondary" mt={.5}>Transaction categories and budget buckets are separate. Income feeds monthly income; excluded categories do not count as spending.</Typography></Box>
          </Stack>
        </CardContent></Card>
      </Box>
      {categories.length === 0 && !loading ? (
        <Alert severity="info">No transaction categories are configured.</Alert>
      ) : (
        <Paper variant="outlined" className="categories__list">
          <Box className="categories__list-header">
            <Typography fontWeight={750}>Transaction category</Typography>
            <Typography fontWeight={750}>Assigned activity</Typography>
            <Typography fontWeight={750}>Budget treatment</Typography>
          </Box>
          {categories.map((category) => {
            const categoryActivity = activity.get(category.categoryId) ?? { count: 0, total: 0 };
            const income = category.name === "Income";
            return (
              <Box className="categories__row" key={category.categoryId}>
                <Box>
                  <Typography fontWeight={700}>{category.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{category.description}</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={`${categoryActivity.count} transactions`} />
                  {categoryActivity.total > 0 && <Chip size="small" variant="outlined" label={formatCurrency(categoryActivity.total)} />}
                </Stack>
                <TextField
                  select
                  label="Budget bucket"
                  value={category.budgetBucket ?? ""}
                  disabled={updatingId === category.categoryId || income}
                  onChange={(event) => void updateBudgetBucket(category.categoryId, event.target.value)}
                  helperText={income ? "Feeds monthly income" : category.budgetBucket ? "Counts toward this bucket" : "Excluded from spending"}
                >
                  <MenuItem value="">Excluded from spending</MenuItem>
                  {BUDGET_CATEGORIES.map((budgetCategory: BudgetCategory) => (
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
