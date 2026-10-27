import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BUDGET_CATEGORIES, BUDGET_COLORS } from "../budgetConstants";
import type { BudgetController } from "../useBudget";
import { formatCurrency } from "../budgetUtils";

export function ChartsSection({ budget }: { budget: BudgetController }) {
  const data = BUDGET_CATEGORIES.map((category) => ({
    name: category,
    shortName: category.replace(" Necessities", "").replace("Irregular & Sinking Funds", "Sinking Funds"),
    actual: budget.actuals[category],
    budget: budget.numericGoals[category],
  }));
  const pieData = data.filter((row) => row.actual > 0);

  return (
    <Box className="budget__charts">
      <Card><CardContent>
        <Typography variant="h6" fontWeight={750}>Actual spending</Typography>
        <Typography variant="body2" color="text.secondary">How this month is distributed across budget groups.</Typography>
        <Box className="budget__chart-frame">
          {pieData.length === 0 ? <Typography color="text.secondary">No mapped spending found for this month.</Typography> : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="actual" nameKey="name" innerRadius={58} outerRadius={100} paddingAngle={2}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={BUDGET_COLORS[entry.name]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent></Card>
      <Card><CardContent>
        <Typography variant="h6" fontWeight={750}>Budget vs. Actual</Typography>
        <Typography variant="body2" color="text.secondary">A direct comparison of your plan and recorded spending.</Typography>
        <Box className="budget__chart-frame">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 16, right: 10, left: 0, bottom: 34 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.22} />
              <XAxis dataKey="shortName" angle={-18} textAnchor="end" interval={0} height={64} fontSize={11} />
              <YAxis tickFormatter={(value) => `$${Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(0)}k` : value}`} width={48} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(_, payload) => payload[0]?.payload.name ?? ""} />
              <Legend />
              <Bar dataKey="budget" name="Budget" fill="#75B89F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#D9A96C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent></Card>
    </Box>
  );
}
