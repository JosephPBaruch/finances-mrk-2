import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  BUDGET_CATEGORIES,
  BUDGET_COLORS,
  RECOMMENDED_PERCENTAGES,
  SAVINGS_CATEGORIES,
} from "../budgetConstants";
import type { BudgetController } from "../useBudget";
import { formatCurrency, parseAmount, recommendationStatus } from "../budgetUtils";

export function GoalsPanel({ budget, periodLabel }: { budget: BudgetController; periodLabel: string }) {
  return (
    <Accordion defaultExpanded className="budget__accordion">
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Typography fontWeight={750}>Budget Goals — {periodLabel}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {budget.income <= 0 && <Alert severity="info">Add monthly income to use percentage-based budgeting.</Alert>}
          <Typography variant="body2" color="text.secondary">
            Suggested starting point: keep necessities and lifestyle at or below their targets, and treat savings and sinking-fund targets as minimums. Green is on target; red needs attention.
          </Typography>
          <Box className="goals-panel__rows">
            {BUDGET_CATEGORIES.map((category) => {
              const percentage = budget.income > 0 ? (parseAmount(budget.goals[category]) / budget.income) * 100 : 0;
              const status = recommendationStatus(category, percentage);
              return (
                <Box className="goals-panel__row" key={category}>
                  <Box className="goals-panel__name">
                    <span className="goals-panel__dot" style={{ backgroundColor: BUDGET_COLORS[category] }} />
                    <Box>
                      <Typography fontWeight={700}>{category}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {SAVINGS_CATEGORIES.has(category) ? "At least" : "Up to"} {RECOMMENDED_PERCENTAGES[category]}% recommended
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" mt={0.75}>
                        <Chip
                          size="small"
                          color={budget.overriddenGoals.includes(category) ? "default" : "success"}
                          variant="outlined"
                          label={budget.overriddenGoals.includes(category) ? "Custom for this month" : "Recommended default"}
                        />
                        {budget.overriddenGoals.includes(category) && (
                          <Button size="small" onClick={() => budget.resetGoalToRecommended(category)}>Use default</Button>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                  <TextField
                    label="Amount"
                    type="number"
                    value={budget.goals[category]}
                    inputProps={{ min: 0, step: "0.01", "aria-label": `${category} dollar goal` }}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    onChange={(event) => budget.setGoal(category, event.target.value)}
                  />
                  <TextField
                    label="Income %"
                    type="number"
                    value={budget.income > 0 ? percentage.toFixed(1) : ""}
                    disabled={budget.income <= 0}
                    color={status === "favorable" ? "success" : status === "unfavorable" ? "error" : "primary"}
                    focused={budget.income > 0}
                    inputProps={{ min: 0, step: "0.1", "aria-label": `${category} income percentage` }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    onChange={(event) => {
                      const nextPercentage = parseAmount(event.target.value);
                      budget.setGoal(category, ((nextPercentage * budget.income) / 100).toFixed(2));
                    }}
                  />
                </Box>
              );
            })}
          </Box>
          <Typography fontWeight={750} textAlign="right">
            Total budgeted: {formatCurrency(budget.totalGoal)} / {formatCurrency(budget.income)} ({budget.income > 0 ? ((budget.totalGoal / budget.income) * 100).toFixed(1) : "0.0"}%)
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
