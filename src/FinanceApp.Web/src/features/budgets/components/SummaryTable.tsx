import { Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { BUDGET_CATEGORIES, RECOMMENDED_PERCENTAGES, SAVINGS_CATEGORIES } from "../budgetConstants";
import type { BudgetController } from "../useBudget";
import { formatCurrency, spendingStatus, totalOutflowStatus } from "../budgetUtils";

const statusClass = (status: string) => `budget-summary__row budget-summary__row--${status}`;

export function SummaryTable({ budget, periodLabel }: { budget: BudgetController; periodLabel: string }) {
  const totalActual = BUDGET_CATEGORIES.reduce((total, category) => total + budget.actuals[category], 0);
  const totalPercentage = budget.income > 0 ? (totalActual / budget.income) * 100 : 0;
  const totalStatus = totalOutflowStatus(budget.income, totalActual);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={750} mb={2}>Monthly Budget Summary — {periodLabel}</Typography>
        <TableContainer component={Box}>
          <Table size="small" aria-label="Monthly budget summary">
            <TableHead><TableRow>
              <TableCell>Budget Group</TableCell><TableCell align="right">Goal</TableCell>
              {budget.income > 0 && <TableCell align="right">% of Income</TableCell>}
              <TableCell align="right">Recommended</TableCell><TableCell align="right">Actual</TableCell>
              <TableCell align="right">Difference</TableCell><TableCell align="right">% Used</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {BUDGET_CATEGORIES.map((category) => {
                const goal = budget.numericGoals[category];
                const actual = budget.actuals[category];
                const savings = SAVINGS_CATEGORIES.has(category);
                const difference = savings ? actual - goal : goal - actual;
                const status = spendingStatus(category, goal, actual);
                return (
                  <TableRow key={category} className={statusClass(status)}>
                    <TableCell><strong>{category}</strong></TableCell>
                    <TableCell align="right">{formatCurrency(goal)}</TableCell>
                    {budget.income > 0 && <TableCell align="right">{((goal / budget.income) * 100).toFixed(1)}%</TableCell>}
                    <TableCell align="right">{savings ? "≥" : "≤"}{RECOMMENDED_PERCENTAGES[category]}%</TableCell>
                    <TableCell align="right">{formatCurrency(actual)}</TableCell>
                    <TableCell align="right" className={`budget-summary__value--${status}`}>{goal > 0 ? formatCurrency(difference, true) : "—"}</TableCell>
                    <TableCell align="right">{goal > 0 ? `${((actual / goal) * 100).toFixed(1)}%` : "—"}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className={statusClass(totalStatus)}>
                <TableCell><strong>Total outflow vs. income</strong></TableCell>
                <TableCell align="right">{formatCurrency(budget.income)}</TableCell>
                {budget.income > 0 && <TableCell align="right">100.0%</TableCell>}
                <TableCell align="right">98–102%</TableCell>
                <TableCell align="right">{formatCurrency(totalActual)}</TableCell>
                <TableCell align="right" className={`budget-summary__value--${totalStatus}`}>{formatCurrency(budget.income - totalActual, true)}</TableCell>
                <TableCell align="right">{budget.income > 0 ? `${totalPercentage.toFixed(1)}%` : "—"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
