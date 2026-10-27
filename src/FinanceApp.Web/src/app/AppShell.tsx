import AccountBalanceWalletRounded from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import SpaceDashboardRounded from "@mui/icons-material/SpaceDashboardRounded";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ConnectBankDialog } from "../features/banking/ConnectBankDialog";
import { BrandMark } from "./BrandMark";
import "./AppShell.scss";

const routes = [
  { path: "/summary", label: "Summary", icon: <SpaceDashboardRounded /> },
  { path: "/transactions", label: "Transactions", icon: <ReceiptLongRounded /> },
  { path: "/categories", label: "Categories", icon: <CategoryRounded /> },
  { path: "/budget", label: "Budget", icon: <AccountBalanceWalletRounded /> },
] as const;

export function AppShell({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <Box className="app-shell">
      {desktop ? (
        <aside className="app-shell__sidebar">
          <BrandMark inverse />
          <Typography className="app-shell__overline" variant="overline">Workspace</Typography>
          <nav className="app-shell__nav" aria-label="Main navigation">
            {routes.map((route) => (
              <NavLink key={route.path} to={route.path} className={({ isActive }) => `app-shell__nav-item ${isActive ? "app-shell__nav-item--active" : ""}`}>
                {route.icon}<span>{route.label}</span>
              </NavLink>
            ))}
          </nav>
          <Box className="app-shell__account">
            <Button fullWidth variant="contained" color="secondary" startIcon={<AddRounded />} onClick={() => setConnectOpen(true)}>
              Connect bank
            </Button>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: "rgba(255,255,255,.14)", color: "white" }}>F</Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography color="white" fontWeight={700} noWrap>Finance workspace</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,.62)" }}>Local development user</Typography>
              </Box>
              <Tooltip title={darkMode ? "Use light mode" : "Use dark mode"}>
                <IconButton aria-label={darkMode ? "Use light mode" : "Use dark mode"} onClick={onToggleTheme} sx={{ color: "white" }}>
                  {darkMode ? <LightModeRounded /> : <DarkModeRounded />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </aside>
      ) : (
        <header className="app-shell__mobile-header">
          <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} pt={1.5}>
            <BrandMark inverse />
            <Stack direction="row">
              <IconButton aria-label="Connect bank" onClick={() => setConnectOpen(true)} sx={{ color: "white" }}><AddRounded /></IconButton>
              <IconButton aria-label={darkMode ? "Use light mode" : "Use dark mode"} onClick={onToggleTheme} sx={{ color: "white" }}>
                {darkMode ? <LightModeRounded /> : <DarkModeRounded />}
              </IconButton>
            </Stack>
          </Stack>
          <Tabs
            value={routes.some((route) => route.path === location.pathname) ? location.pathname : false}
            onChange={(_, value: string) => navigate(value)}
            variant="scrollable"
            scrollButtons={false}
            textColor="inherit"
            aria-label="Main navigation"
          >
            {routes.map((route) => <Tab key={route.path} value={route.path} label={route.label} />)}
          </Tabs>
        </header>
      )}
      <main className="app-shell__main"><Outlet /></main>
      <ConnectBankDialog open={connectOpen} onClose={() => setConnectOpen(false)} />
    </Box>
  );
}
