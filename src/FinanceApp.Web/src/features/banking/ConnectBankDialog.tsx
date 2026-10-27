import AccountBalanceRounded from "@mui/icons-material/AccountBalanceRounded";
import ScienceRounded from "@mui/icons-material/ScienceRounded";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { usePlaidLink, type PlaidLinkOnSuccess } from "react-plaid-link";
import { useAppData } from "../../app/AppDataProvider";
import { useNotification } from "../../shared/notifications/NotificationProvider";
import { bankingApi } from "./bankingApi";

type ConnectionMode = "link" | "sandbox" | "both";

const connectionMode: ConnectionMode = import.meta.env.VITE_PLAID_CONNECTION_MODE ?? "both";
const linkTokenStorageKey = "financePlaidLinkToken";

const delay = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export function ConnectBankDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refresh } = useAppData();
  const { notify } = useNotification();
  const oauthRedirect = new URLSearchParams(window.location.search).has("oauth_state_id");
  const [linkToken, setLinkToken] = useState<string | null>(() => oauthRedirect ? sessionStorage.getItem(linkTokenStorageKey) : null);
  const [pendingOpen, setPendingOpen] = useState(() => oauthRedirect && sessionStorage.getItem(linkTokenStorageKey) !== null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finishConnection = async (bankConnectionId: string) => {
    notify("Bank connected. Plaid is preparing transactions…", "success");
    await delay(3500);
    try {
      const sync = await bankingApi.syncConnection(bankConnectionId);
      notify(
        sync.added > 0 ? `${sync.added} transactions are ready.` : "Connected. Plaid may still be preparing history; Sync all again shortly.",
        sync.added > 0 ? "success" : "info",
      );
    } catch {
      notify("The bank is connected; transaction history can be synced again from the dashboard.", "info");
    }
    await refresh();
    onClose();
  };

  const onSuccess: PlaidLinkOnSuccess = async (publicToken) => {
    sessionStorage.removeItem(linkTokenStorageKey);
    setBusy(true);
    setError(null);
    try {
      const connection = await bankingApi.exchangePublicToken(publicToken);
      await finishConnection(connection.bankConnectionId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to finish the bank connection.");
    } finally {
      setBusy(false);
    }
  };

  const plaidConfig = {
    token: linkToken,
    onSuccess,
    onExit: () => setPendingOpen(false),
    receivedRedirectUri: oauthRedirect ? window.location.href : undefined,
  };
  const { open: openPlaid, ready } = usePlaidLink(plaidConfig);

  useEffect(() => {
    if (pendingOpen && ready) {
      setPendingOpen(false);
      openPlaid();
    }
  }, [openPlaid, pendingOpen, ready]);

  const startPlaid = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await bankingApi.createLinkToken();
      sessionStorage.setItem(linkTokenStorageKey, response.linkToken);
      setLinkToken(response.linkToken);
      setPendingOpen(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start Plaid Link.");
    } finally {
      setBusy(false);
    }
  };

  const startSandbox = async () => {
    setBusy(true);
    setError(null);
    try {
      const connection = await bankingApi.connectSandbox();
      await finishConnection(connection.bankConnectionId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create a Sandbox connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Connect a bank</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Plaid securely handles institution sign-in. Finances receives an access token and never sees your bank password.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {(connectionMode === "link" || connectionMode === "both") && (
            <Button
              variant="contained"
              size="large"
              startIcon={<AccountBalanceRounded />}
              disabled={busy}
              onClick={() => void startPlaid()}
            >
              Continue with Plaid
            </Button>
          )}
          {(connectionMode === "sandbox" || connectionMode === "both") && (
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
              <Stack spacing={1.5}>
                <Typography fontWeight={700}>Developer Sandbox</Typography>
                <Typography variant="body2" color="text.secondary">
                  Create First Platypus Bank test accounts without opening Plaid Link.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<ScienceRounded />}
                  disabled={busy}
                  onClick={() => void startSandbox()}
                >
                  Add Sandbox bank
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={onClose}>Cancel</Button></DialogActions>
    </Dialog>
  );
}
