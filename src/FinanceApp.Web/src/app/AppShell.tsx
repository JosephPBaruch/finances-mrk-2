import AccountBalanceWalletRounded from "@mui/icons-material/AccountBalanceWalletRounded";
import AccountBalanceRounded from "@mui/icons-material/AccountBalanceRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import SpaceDashboardRounded from "@mui/icons-material/SpaceDashboardRounded";
import AutoGraphRounded from "@mui/icons-material/AutoGraphRounded";
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
import { useAuth } from "../features/auth/AuthProvider";
import "./AppShell.scss";

const routes = [
  { path: "/summary", label: "Summary", icon: <SpaceDashboardRounded /> },
  { path: "/accounts", label: "Accounts", icon: <AccountBalanceRounded /> },
  { path: "/transactions", label: "Transactions", icon: <ReceiptLongRounded /> },
  { path: "/categories", label: "Categories", icon: <CategoryRounded /> },
  { path: "/budget", label: "Budget", icon: <AccountBalanceWalletRounded /> },
  { path: "/projection", label: "Projection", icon: <AutoGraphRounded /> },
] as const;

export function AppShell({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const [connectOpen, setConnectOpen] = useState(false);
  const { status, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("financeSidebarCollapsed") === "true",
  );

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      localStorage.setItem("financeSidebarCollapsed", String(!current));
      return !current;
    });
  };

  return (
    <Box className={`app-shell ${sidebarCollapsed ? "app-shell--collapsed" : ""}`}>
      {desktop ? (
        <aside className="app-shell__sidebar">
          <Box className="app-shell__brand-row">
            <BrandMark inverse compact={sidebarCollapsed} />
            <Tooltip title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"} placement="right">
              <IconButton
                className="app-shell__collapse"
                aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                onClick={toggleSidebar}
              >
                {sidebarCollapsed ? <ChevronRightRounded /> : <ChevronLeftRounded />}
              </IconButton>
            </Tooltip>
          </Box>
          <Typography className="app-shell__overline" variant="overline">Workspace</Typography>
          <nav className="app-shell__nav" aria-label="Main navigation">
            {routes.map((route) => (
              <Tooltip key={route.path} title={sidebarCollapsed ? route.label : ""} placement="right">
                <NavLink to={route.path} className={({ isActive }) => `app-shell__nav-item ${isActive ? "app-shell__nav-item--active" : ""}`}>
                  {route.icon}<span>{route.label}</span>
                </NavLink>
              </Tooltip>
            ))}
          </nav>
          <Box className="app-shell__account">
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={sidebarCollapsed ? undefined : <AddRounded />}
              aria-label="Connect bank"
              onClick={() => setConnectOpen(true)}
            >
              {sidebarCollapsed ? <AddRounded /> : "Connect bank"}
            </Button>
            <Stack className="app-shell__profile" direction="row" alignItems="center" spacing={1.25}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: "rgba(255,255,255,.14)", color: "white" }}>{status?.displayName.charAt(0).toUpperCase() ?? "F"}</Avatar>
              <Box className="app-shell__profile-copy" sx={{ minWidth: 0, flex: 1 }}>
                <Typography color="white" fontWeight={700} noWrap>{status?.displayName ?? "Finance admin"}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,.62)" }}>{status?.email}</Typography>
              </Box>
              <Tooltip title={darkMode ? "Use light mode" : "Use dark mode"}>
                <IconButton aria-label={darkMode ? "Use light mode" : "Use dark mode"} onClick={onToggleTheme} sx={{ color: "white" }}>
                  {darkMode ? <LightModeRounded /> : <DarkModeRounded />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Sign out">
                <IconButton aria-label="Sign out" onClick={() => void logout()} sx={{ color: "white" }}>
                  <LogoutRounded />
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
              <IconButton aria-label="Sign out" onClick={() => void logout()} sx={{ color: "white" }}><LogoutRounded /></IconButton>
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
