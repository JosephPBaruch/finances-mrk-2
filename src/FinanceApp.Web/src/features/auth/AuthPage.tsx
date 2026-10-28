import LockRounded from "@mui/icons-material/LockRounded";
import { Alert, Box, Button, Card, CardContent, CircularProgress, InputAdornment, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { BrandMark } from "../../app/BrandMark";
import { useAuth } from "./AuthProvider";
import "./AuthPage.scss";

export function AuthPage() {
  const { status, loading, setup, login } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !status) return <Box className="auth-page"><CircularProgress /></Box>;
  const initialSetup = status.needsSetup;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 12) return setError("Use at least 12 characters.");
    if (initialSetup && password !== confirmation) return setError("The passwords do not match.");
    setSubmitting(true);
    try {
      if (initialSetup) await setup(password);
      else await login(password);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="auth-page">
      <Box className="auth-page__glow" />
      <Card className="auth-page__card">
        <CardContent>
          <BrandMark />
          <Box className="auth-page__lock"><LockRounded /></Box>
          <Typography variant="h4" component="h1">{initialSetup ? "Create your admin password" : "Welcome back"}</Typography>
          <Typography color="text.secondary" mt={1} mb={3} lineHeight={1.65}>
            {initialSetup
              ? `Secure the single admin account for ${status.email}. This one-time setup cannot be repeated through the API.`
              : `Sign in to ${status.displayName} with the admin password.`}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={(event) => void submit(event)}>
            <TextField fullWidth autoFocus label="Password" type="password" autoComplete={initialSetup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><LockRounded fontSize="small" /></InputAdornment> }} />
            {initialSetup && <TextField fullWidth sx={{ mt: 2 }} label="Confirm password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />}
            <Button fullWidth size="large" type="submit" variant="contained" disabled={submitting} sx={{ mt: 2.5 }}>
              {submitting ? "Please wait…" : initialSetup ? "Secure my account" : "Sign in"}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2.5}>
            Local, single-admin access · No public registration
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
