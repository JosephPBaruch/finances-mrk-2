import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import TrendingDownRounded from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAppData } from "../../app/AppDataProvider";
import { BUDGET_CATEGORIES, BUDGET_COLORS } from "../budgets/budgetConstants";
import { loadCategoryMappings } from "../budgets/budgetStorage";
import { calculateActuals, formatCurrency, isInPeriod } from "../budgets/budgetUtils";
import { summarizeAccounts } from "../accounts/accountUtils";
import "./SummaryPage.scss";

const statIcons = [<TrendingDownRounded />, <TrendingUpRounded />, <AutoAwesomeRounded />, <ReceiptLongRounded />];

function completedMonths(count: number): Array<{ month: number; year: number; label: string }> {
  const result: Array<{ month: number; year: number; label: string }> = [];
  const current = new Date();
  for (let offset = count; offset >= 1; offset -= 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - offset, 1);
    result.push({ month: date.getMonth() + 1, year: date.getFullYear(), label: date.toLocaleString("en-US", { month: "short", year: "2-digit" }) });
  }
  return result;
}

export default function SummaryPage() {
  const { transactions, connections, accounts, loading, error } = useAppData();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [trendMonths, setTrendMonths] = useState(6);
  const mappings = loadCategoryMappings();
  const actuals = useMemo(() => calculateActuals(transactions, month, year, mappings), [mappings, month, transactions, year]);
  const periodTransactions = transactions.filter((transaction) => isInPeriod(transaction.date, month, year));
  const expenseTransactions = periodTransactions.filter((transaction) => transaction.amount > 0);
  const totalSpending = expenseTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const totalIncome = Math.abs(periodTransactions.filter((transaction) => transaction.amount < 0)
    .reduce((total, transaction) => total + transaction.amount, 0));
  const netCashFlow = totalIncome - totalSpending;
  const accountTotals = summarizeAccounts(accounts);
  const categorized = periodTransactions.filter((transaction) => transaction.plaidPrimaryCategory !== null).length;
  const needsAttention = periodTransactions.filter((transaction) => !transaction.plaidPrimaryCategory || transaction.plaidCategoryConfidence === "LOW").length;
  const pieData = BUDGET_CATEGORIES.map((name) => ({ name, value: actuals[name] })).filter((item) => item.value > 0);
  const monthOptions = Array.from({ length: 12 }, (_, index) => new Date(2024, index, 1).toLocaleString("en-US", { month: "long" }));
  const trendData = completedMonths(trendMonths).map((period) => ({
    label: period.label,
    ...calculateActuals(transactions, period.month, period.year, mappings),
  }));
  const stats = [
    { label: "Monthly outflow", value: formatCurrency(totalSpending) },
    { label: "Monthly inflow", value: formatCurrency(totalIncome) },
    { label: "Net cash flow", value: formatCurrency(netCashFlow, true) },
    { label: "Transactions", value: String(periodTransactions.length) },
  ];

  return (
    <div className="page summary">
      <header className="page__header">
        <Box><span className="page__eyebrow">A calmer money picture</span><Typography component="h1" className="page__title">Summary</Typography>
          <p className="page__subtitle">A monthly view of what came through your connected accounts and where Plaid placed it.</p>
        </Box>
        <Stack direction="row" spacing={1}>
          <TextField select label="Month" value={month} onChange={(event) => setMonth(Number(event.target.value))} sx={{ minWidth: 138 }}>
            {monthOptions.map((name, index) => <MenuItem key={name} value={index + 1}>{name}</MenuItem>)}
          </TextField>
          <TextField label="Year" type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} sx={{ width: 105 }} />
        </Stack>
      </header>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      <Card className="summary__net-worth"><CardContent>
        <Box>
          <Typography variant="body2" color="text.secondary">Estimated net worth</Typography>
          <Typography variant="h3" mt={0.6}>{formatCurrency(accountTotals.netWorth)}</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>Across {accounts.length} connected account{accounts.length === 1 ? "" : "s"}</Typography>
        </Box>
        <Box className="summary__net-breakdown">
          <Box><Typography variant="caption" color="text.secondary">Assets</Typography><Typography variant="h6" color="success.main">{formatCurrency(accountTotals.assets)}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Liabilities</Typography><Typography variant="h6" color="error.main">{formatCurrency(accountTotals.liabilities)}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Categorized</Typography><Typography variant="h6">{periodTransactions.length ? `${Math.round((categorized / periodTransactions.length) * 100)}%` : "0%"}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary">Needs review</Typography><Typography variant="h6" color={needsAttention ? "warning.main" : "success.main"}>{needsAttention}</Typography></Box>
        </Box>
      </CardContent></Card>
      <Box className="summary__stats">
        {stats.map((stat, index) => <Card key={stat.label}><CardContent className="summary__stat"><Box className="summary__stat-icon">{statIcons[index]}</Box><Box><Typography variant="body2" color="text.secondary">{stat.label}</Typography><Typography variant="h4" mt={.4}>{stat.value}</Typography></Box></CardContent></Card>)}
      </Box>
      <Box className="summary__grid">
        <Card><CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="h6" fontWeight={750}>Spending mix</Typography><Typography variant="body2" color="text.secondary">Actual outflow by budget bucket</Typography></Box><Chip size="small" label={`${monthOptions[month - 1]} ${year}`} color="secondary" variant="outlined" /></Stack>
          <Box className="summary__chart">
            {pieData.length === 0 ? <Typography color="text.secondary">No spending found for this period.</Typography> : <ResponsiveContainer width="100%" height={310}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={66} outerRadius={110} paddingAngle={2}>{pieData.map((entry) => <Cell key={entry.name} fill={BUDGET_COLORS[entry.name]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} /><Legend /></PieChart></ResponsiveContainer>}
          </Box>
        </CardContent></Card>
        <Card><CardContent>
          <Typography variant="h6" fontWeight={750}>Spending by budget bucket</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>Ranked by this month’s total</Typography>
          <Stack spacing={2}>
            {[...BUDGET_CATEGORIES].sort((left, right) => actuals[right] - actuals[left]).map((category) => {
              const share = totalSpending > 0 ? (actuals[category] / totalSpending) * 100 : 0;
              return <Box key={category}><Stack direction="row" justifyContent="space-between" mb={.6}><Typography fontWeight={650}>{category}</Typography><Typography>{formatCurrency(actuals[category])}</Typography></Stack><LinearProgress variant="determinate" value={share} sx={{ height: 7, borderRadius: 8, "& .MuiLinearProgress-bar": { backgroundColor: BUDGET_COLORS[category] } }} /></Box>;
            })}
          </Stack>
        </CardContent></Card>
      </Box>
      <Card className="summary__trend"><CardContent>
        <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start" mb={2} flexWrap="wrap"><Box><Typography variant="h6" fontWeight={750}>Budget groups over time</Typography><Typography variant="body2" color="text.secondary">Completed months ending last month</Typography></Box><TextField select label="Range" value={trendMonths} onChange={(event) => setTrendMonths(Number(event.target.value))} sx={{ width: 130 }}>{[3, 6, 12, 24].map((count) => <MenuItem value={count} key={count}>{count} months</MenuItem>)}</TextField></Stack>
        <ResponsiveContainer width="100%" height={330}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={.2} /><XAxis dataKey="label" /><YAxis tickFormatter={(value) => `$${Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(0)}k` : value}`} /><Tooltip formatter={(value) => formatCurrency(Number(value))} /><Legend />{BUDGET_CATEGORIES.map((category) => <Line key={category} type="monotone" dataKey={category} stroke={BUDGET_COLORS[category]} dot={false} strokeWidth={2} />)}</LineChart></ResponsiveContainer>
      </CardContent></Card>
      {connections.length > 0 && <Paper variant="outlined" className="summary__connections"><Typography fontWeight={750}>Connected institutions</Typography><Stack direction="row" gap={1} flexWrap="wrap">{connections.map((connection) => <Chip key={connection.bankConnectionId} color={connection.status === "Active" ? "success" : "warning"} variant="outlined" label={`${connection.institutionName ?? "Bank"} · ${connection.accounts.length} accounts`} />)}</Stack></Paper>}
    </div>
  );
}
