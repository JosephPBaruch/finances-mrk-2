import AttachMoneyRounded from "@mui/icons-material/AttachMoneyRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import { useEffect, useState } from "react";
import type { BudgetController } from "../useBudget";
import { formatCurrency, parseAmount } from "../budgetUtils";

export function IncomePanel({ budget, periodLabel }: { budget: BudgetController; periodLabel: string }) {
  const [input, setInput] = useState(String(budget.income || ""));
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => setInput(String(budget.income || "")), [budget.income, budget.month, budget.year]);

  const proposed = parseAmount(input);
  const confirm = () => {
    budget.saveIncome(proposed);
    setDialogOpen(false);
  };

  return (
    <>
      <Accordion defaultExpanded className="budget__accordion">
        <AccordionSummary expandIcon={<ExpandMoreRounded />}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography fontWeight={750}>Monthly Income — {periodLabel}</Typography>
            {budget.income > 0 && <Typography color="text.secondary">({formatCurrency(budget.income)})</Typography>}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5} maxWidth={520}>
            <TextField
              label="Monthly Income"
              type="number"
              value={input}
              inputProps={{ min: 0, step: "0.01" }}
              InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoneyRounded fontSize="small" /></InputAdornment> }}
              onChange={(event) => {
                setInput(event.target.value);
                budget.setIncome(parseAmount(event.target.value));
              }}
              onBlur={() => {
                if (Math.abs(proposed - budget.savedIncome) > 0.001) setDialogOpen(true);
              }}
            />
            {budget.transactionIncome > 0 && (
              <Typography variant="body2" color="text.secondary">
                From Plaid income transactions: {formatCurrency(budget.transactionIncome)}
              </Typography>
            )}
            {budget.previousIncome !== null && budget.previousIncome > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">Last month: {formatCurrency(budget.previousIncome)}</Typography>
                <Button size="small" onClick={() => { setInput(String(budget.previousIncome)); budget.setIncome(budget.previousIncome ?? 0); }}>Use this</Button>
              </Stack>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Dialog open={dialogOpen} onClose={() => { setInput(String(budget.savedIncome || "")); budget.setIncome(budget.savedIncome); setDialogOpen(false); }}>
        <DialogTitle>Update Monthly Income</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography>Set income for {periodLabel} to <strong>{formatCurrency(proposed)}</strong>?</Typography>
            {budget.previousIncome !== null && <Typography mt={1} color="text.secondary">Previous month: {formatCurrency(budget.previousIncome)}</Typography>}
            <Typography mt={2} variant="body2" color="text.secondary">Goal dollar values stay unchanged; percentages will be recalculated.</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setInput(String(budget.savedIncome || "")); budget.setIncome(budget.savedIncome); setDialogOpen(false); }}>Cancel</Button>
          <Button variant="contained" onClick={confirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
