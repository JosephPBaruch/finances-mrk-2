import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import { Alert, Box, Button, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ChartsSection } from "./components/ChartsSection";
import { GoalsPanel } from "./components/GoalsPanel";
import { IncomePanel } from "./components/IncomePanel";
import { SummaryTable } from "./components/SummaryTable";
import { useBudget } from "./useBudget";
import { relativeSavedAt } from "./budgetUtils";
import "./Budget.scss";

const monthNames = Array.from({ length: 12 }, (_, index) => new Date(2024, index, 1).toLocaleString("en-US", { month: "long" }));

export default function BudgetPage() {
  const budget = useBudget();
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const periodLabel = `${monthNames[budget.month - 1]} ${budget.year}`;

  return (
    <div className="page budget">
      <header className="page__header">
        <Box><span className="page__eyebrow">Plan with intention</span><Typography component="h1" className="page__title">Budget</Typography>
          <p className="page__subtitle">Set five clear monthly targets. Plaid categories are mapped automatically, and you can refine every bucket.</p>
        </Box>
      </header>
      <Paper className="budget__toolbar" variant="outlined">
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton aria-label="Previous month" onClick={() => budget.navigateMonth(-1)}><ArrowBackRounded /></IconButton>
          <Typography variant="h6" minWidth={170} textAlign="center" fontWeight={750}>{periodLabel}</Typography>
          <IconButton aria-label="Next month" onClick={() => budget.navigateMonth(1)}><ArrowForwardRounded /></IconButton>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <TextField select label="Month" value={budget.month} onChange={(event) => budget.setMonth(Number(event.target.value))} sx={{ minWidth: 140 }}>
            {monthNames.map((name, index) => <MenuItem key={name} value={index + 1}>{name}</MenuItem>)}
          </TextField>
          <TextField label="Year" type="number" value={budget.year} inputProps={{ min: 2000, max: 2100 }} onChange={(event) => budget.setYear(Math.min(2100, Math.max(2000, Number(event.target.value))))} sx={{ width: 108 }} />
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center" ml="auto">
          <Tooltip title={budget.lastSavedAt ? new Date(budget.lastSavedAt).toLocaleString() : "No saved changes"}>
            <Typography variant="caption" color="text.secondary">Last saved {relativeSavedAt(budget.lastSavedAt, clock)}</Typography>
          </Tooltip>
          <Button variant="contained" startIcon={<SaveRounded />} onClick={budget.save}>Save</Button>
        </Stack>
      </Paper>
      {budget.saveStatus === "error" && <Alert severity="error">Budget changes could not be saved in this browser.</Alert>}
      {budget.saveStatus === "saved" && <Alert severity="success" className="budget__save-alert">Budget saved.</Alert>}
      <Stack spacing={2}>
        <IncomePanel budget={budget} periodLabel={periodLabel} />
        <GoalsPanel budget={budget} periodLabel={periodLabel} />
        <ChartsSection budget={budget} />
        <SummaryTable budget={budget} periodLabel={periodLabel} />
      </Stack>
    </div>
  );
}
