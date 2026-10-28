import AutoGraphRounded from "@mui/icons-material/AutoGraphRounded";
import FlagRounded from "@mui/icons-material/FlagRounded";
import { Box, Card, CardContent, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "../../app/AppDataProvider";
import { summarizeAccounts } from "../accounts/accountUtils";
import { formatCurrency } from "../budgets/budgetUtils";
import { projectWealth, targetYear } from "./projectionUtils";
import "./ProjectionPage.scss";

function recentMonthlyCashFlow(transactions: ReturnType<typeof useAppData>["transactions"]): number {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);
  const totals = new Map<string, number>();
  transactions.forEach((transaction) => {
    const date = new Date(`${transaction.date}T00:00:00`);
    if (date < cutoff) return;
    const key = transaction.date.slice(0, 7);
    totals.set(key, (totals.get(key) ?? 0) - transaction.amount);
  });
  if (totals.size === 0) return 0;
  return Math.max(0, Math.round([...totals.values()].reduce((sum, value) => sum + value, 0) / totals.size));
}

export default function ProjectionPage() {
  const { accounts, transactions } = useAppData();
  const startingNetWorth = useMemo(() => summarizeAccounts(accounts).netWorth, [accounts]);
  const suggestedContribution = useMemo(() => recentMonthlyCashFlow(transactions), [transactions]);
  const [monthlyContribution, setMonthlyContribution] = useState(suggestedContribution);
  const [annualReturn, setAnnualReturn] = useState(6);
  const [inflation, setInflation] = useState(2.5);
  const [years, setYears] = useState(30);
  const [target, setTarget] = useState(1_000_000);
  const data = useMemo(
    () => projectWealth(startingNetWorth, monthlyContribution, annualReturn, inflation, years),
    [annualReturn, inflation, monthlyContribution, startingNetWorth, years],
  );
  const targetInYears = targetYear(data, target);
  const ending = data.at(-1) ?? { nominal: startingNetWorth, real: startingNetWorth };

  return (
    <div className="page projection">
      <header className="page__header">
        <Box>
          <span className="page__eyebrow">Turn today into a direction</span>
          <Typography component="h1" className="page__title">Wealth projection</Typography>
          <p className="page__subtitle">Explore a planning estimate based on your current net worth, contributions, return assumptions, and inflation.</p>
        </Box>
      </header>
      <Box className="projection__layout">
        <Card className="projection__controls"><CardContent>
          <Stack direction="row" spacing={1.25} alignItems="center" mb={2.5}><Box className="projection__icon"><AutoGraphRounded /></Box><Box><Typography variant="h6" fontWeight={750}>Assumptions</Typography><Typography variant="body2" color="text.secondary">Adjust the plan, not the past.</Typography></Box></Stack>
          <Stack spacing={2}>
            <TextField label="Starting net worth" value={startingNetWorth.toFixed(0)} disabled InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            <TextField label="Monthly contribution" type="number" value={monthlyContribution} onChange={(event) => setMonthlyContribution(Math.max(0, Number(event.target.value)))} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} helperText={suggestedContribution > 0 ? `${formatCurrency(suggestedContribution)} suggested from recent cash flow` : "Enter what you expect to invest each month"} />
            <Box className="projection__control-grid">
              <TextField label="Annual return" type="number" value={annualReturn} onChange={(event) => setAnnualReturn(Number(event.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
              <TextField label="Inflation" type="number" value={inflation} onChange={(event) => setInflation(Number(event.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
              <TextField label="Years" type="number" value={years} inputProps={{ min: 1, max: 60 }} onChange={(event) => setYears(Math.min(60, Math.max(1, Number(event.target.value))))} />
              <TextField label="Target" type="number" value={target} onChange={(event) => setTarget(Math.max(0, Number(event.target.value)))} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            </Box>
          </Stack>
        </CardContent></Card>
        <Box className="projection__results">
          <Box className="projection__stats">
            <Card><CardContent><Typography variant="body2" color="text.secondary">Projected balance</Typography><Typography variant="h4" mt={0.5}>{formatCurrency(ending.nominal)}</Typography><Typography variant="caption" color="text.secondary">in {years} years</Typography></CardContent></Card>
            <Card><CardContent><Typography variant="body2" color="text.secondary">Today’s dollars</Typography><Typography variant="h4" mt={0.5}>{formatCurrency(ending.real)}</Typography><Typography variant="caption" color="text.secondary">inflation adjusted</Typography></CardContent></Card>
            <Card><CardContent><Typography variant="body2" color="text.secondary">Target estimate</Typography><Typography variant="h4" mt={0.5}>{targetInYears === null ? "Beyond range" : `${targetInYears} years`}</Typography><Typography variant="caption" color="text.secondary">to {formatCurrency(target)}</Typography></CardContent></Card>
          </Box>
          <Card><CardContent>
            <Stack direction="row" spacing={1} alignItems="center"><FlagRounded color="secondary" /><Box><Typography variant="h6" fontWeight={750}>Projected wealth</Typography><Typography variant="body2" color="text.secondary">Nominal value compared with purchasing power in today’s dollars</Typography></Box></Stack>
            <Box className="projection__chart"><ResponsiveContainer width="100%" height={390}><AreaChart data={data} margin={{ top: 24, right: 12, left: 8, bottom: 0 }}><defs><linearGradient id="nominal-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#75B89F" stopOpacity={0.34}/><stop offset="95%" stopColor="#75B89F" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2}/><XAxis dataKey="label"/><YAxis width={64} tickFormatter={(value) => `$${Number(value) >= 1_000_000 ? `${(Number(value) / 1_000_000).toFixed(1)}m` : `${Math.round(Number(value) / 1000)}k`}`}/><Tooltip formatter={(value) => formatCurrency(Number(value))}/><Legend/><Area type="monotone" dataKey="nominal" name="Projected" stroke="#75B89F" strokeWidth={3} fill="url(#nominal-fill)"/><Area type="monotone" dataKey="real" name="Today's dollars" stroke="#D9A96C" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></Box>
          </CardContent></Card>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" mt={2}>Planning estimate only. Returns and inflation are not guaranteed, and taxes, fees, and account-specific rules are not modeled.</Typography>
    </div>
  );
}
