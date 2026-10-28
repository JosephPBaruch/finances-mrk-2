import RefreshRounded from "@mui/icons-material/RefreshRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { useAppData } from "../../app/AppDataProvider";
import type { FinanceTransaction } from "../../shared/api/apiTypes";
import { useNotification } from "../../shared/notifications/NotificationProvider";
import { bankingApi } from "../banking/bankingApi";
import { loadCategoryMappings } from "../budgets/budgetStorage";
import { formatCurrency, resolveBudgetCategory } from "../budgets/budgetUtils";
import { transactionApi } from "./transactionApi";
import { matchesConfidenceFilter, needsCategoryReview, type ConfidenceFilter } from "./confidenceUtils";
import "./TransactionsPage.scss";

export default function TransactionsPage() {
  const { transactions, accounts, categories, loading, error, refresh } = useAppData();
  const { notify } = useNotification();
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("");
  const [pending, setPending] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [syncing, setSyncing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const mappings = loadCategoryMappings();
  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.accountId, account])),
    [accounts],
  );

  const rows = useMemo(() => transactions.filter((transaction) => {
    const haystack = [
      transaction.name,
      transaction.merchantName,
      transaction.userCategoryName,
      transaction.plaidPrimaryCategory,
      transaction.plaidDetailedCategory,
      transaction.plaidCategoryConfidence,
      accountsById.get(transaction.accountId)?.name,
    ]
      .filter(Boolean).join(" ").toLowerCase();
    return (!search || haystack.includes(search.toLowerCase()))
      && (!accountId || transaction.accountId === accountId)
      && (pending === "all" || transaction.pending === (pending === "pending"))
      && matchesConfidenceFilter(transaction, confidenceFilter);
  }), [accountId, accountsById, confidenceFilter, pending, search, transactions]);

  const toggleReviewed = async (transaction: FinanceTransaction) => {
    try {
      await transactionApi.update(transaction.transactionId, { isReviewed: !transaction.isReviewed });
      await refresh();
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to update the transaction.", "error");
    }
  };

  const assignCategory = async (transaction: FinanceTransaction, userCategoryId: string) => {
    setUpdatingId(transaction.transactionId);
    try {
      await transactionApi.update(transaction.transactionId, {
        userCategoryId: userCategoryId || null,
        isReviewed: true,
      });
      await refresh();
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to assign the category.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: GridColDef<FinanceTransaction>[] = [
    { field: "date", headerName: "Date", width: 112, sortComparator: (left, right) => String(left).localeCompare(String(right)) },
    { field: "merchantName", headerName: "Merchant", flex: 1, minWidth: 170, valueGetter: (_value, row) => row.merchantName ?? row.name },
    {
      field: "accountId",
      headerName: "Account",
      flex: 0.8,
      minWidth: 155,
      valueGetter: (_value, row) => {
        const account = accountsById.get(row.accountId);
        return account ? `${account.name}${account.mask ? ` ••${account.mask}` : ""}` : "Unknown account";
      },
    },
    {
      field: "plaidPrimaryCategory",
      headerName: "Category",
      flex: 1,
      minWidth: 220,
      sortable: false,
      renderCell: ({ row }) => (
        <TextField
          select
          fullWidth
          variant="standard"
          value={row.userCategoryId ?? ""}
          disabled={updatingId === row.transactionId}
          SelectProps={{ displayEmpty: true }}
          inputProps={{ "aria-label": `Category for ${row.merchantName ?? row.name}` }}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => void assignCategory(row, event.target.value)}
        >
          <MenuItem value="">Plaid: {(row.plaidPrimaryCategory ?? "Uncategorized").replaceAll("_", " ")}</MenuItem>
          {categories.map((category) => <MenuItem key={category.categoryId} value={category.categoryId}>{category.name}</MenuItem>)}
        </TextField>
      ),
    },
    {
      field: "plaidCategoryConfidence",
      headerName: "Confidence",
      width: 135,
      renderCell: ({ row }) => needsCategoryReview(row)
        ? <Chip size="small" color="warning" icon={<WarningAmberRounded />} label="Needs review" />
        : <Chip size="small" variant="outlined" color="success" label={(row.plaidCategoryConfidence ?? "Assigned").replaceAll("_", " ")} />,
    },
    { field: "budgetBucket", headerName: "Budget Bucket", flex: 1, minWidth: 190, valueGetter: (_value, row) => resolveBudgetCategory(row, mappings) },
    { field: "pending", headerName: "Status", width: 105, renderCell: ({ value }) => <Chip size="small" variant="outlined" color={value ? "warning" : "success"} label={value ? "Pending" : "Posted"} /> },
    { field: "amount", headerName: "Amount", width: 125, align: "right", headerAlign: "right", renderCell: ({ value }) => <span className={Number(value) < 0 ? "transactions__amount--income" : "transactions__amount--expense"}>{formatCurrency(Number(value), Number(value) < 0)}</span> },
    { field: "isReviewed", headerName: "Review", width: 110, sortable: false, renderCell: ({ row }) => <Button size="small" color={row.isReviewed ? "success" : "inherit"} onClick={() => void toggleReviewed(row)}>{row.isReviewed ? "Reviewed" : "Mark"}</Button> },
  ];

  const syncAll = async () => {
    setSyncing(true);
    try {
      const result = await bankingApi.syncAll();
      const added = result.results.reduce((total, item) => total + (item.statistics?.added ?? 0), 0);
      notify(added > 0 ? `${added} new transactions synced.` : "Everything is up to date.", "success");
      await refresh();
    } catch (requestError) {
      notify(requestError instanceof Error ? requestError.message : "Unable to synchronize transactions.", "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="page transactions">
      <header className="page__header">
        <Box><span className="page__eyebrow">Your money, itemized</span><Typography component="h1" className="page__title">Transactions</Typography>
          <p className="page__subtitle">Plaid categories arrive automatically. Review the exceptions, then let your budget update itself.</p>
        </Box>
        <Button variant="contained" startIcon={<RefreshRounded />} disabled={syncing} onClick={() => void syncAll()}>{syncing ? "Syncing…" : "Sync all"}</Button>
      </header>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" className="transactions__filters">
        <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment> }} />
        <TextField select label="Account" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
          <MenuItem value="">All accounts</MenuItem>{accounts.map((account) => <MenuItem key={account.accountId} value={account.accountId}>{account.name} {account.mask ? `••${account.mask}` : ""}</MenuItem>)}
        </TextField>
        <TextField select label="Status" value={pending} onChange={(event) => setPending(event.target.value)}>
          <MenuItem value="all">All transactions</MenuItem><MenuItem value="posted">Posted</MenuItem><MenuItem value="pending">Pending</MenuItem>
        </TextField>
        <TextField select label="Review" value={confidenceFilter} onChange={(event) => setConfidenceFilter(event.target.value as ConfidenceFilter)}>
          <MenuItem value="all">All confidence levels</MenuItem>
          <MenuItem value="needs-category">Needs category review</MenuItem>
          <MenuItem value="unreviewed">Not reviewed</MenuItem>
          <MenuItem value="high-confidence">High confidence</MenuItem>
        </TextField>
        <Typography variant="body2" color="text.secondary" ml="auto">Showing {rows.length} of {transactions.length}</Typography>
      </Paper>
      <Paper variant="outlined" className="transactions__grid">
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.transactionId}
          loading={loading}
          initialState={{ sorting: { sortModel: [{ field: "date", sort: "desc" }] }, pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          getRowClassName={({ row }) => needsCategoryReview(row) ? "transactions__row--attention" : ""}
          sx={{ border: 0, minHeight: 570 }}
        />
      </Paper>
    </div>
  );
}
