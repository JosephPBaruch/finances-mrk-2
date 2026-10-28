import AccountBalanceRounded from "@mui/icons-material/AccountBalanceRounded";
import AccountBalanceWalletRounded from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import SpaceDashboardRounded from "@mui/icons-material/SpaceDashboardRounded";
import {
  Avatar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Stack, Tab, Tabs, Tooltip, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ConnectBankDialog } from "../features/banking/ConnectBankDialog";
import { useAuth } from "../features/auth/AuthProvider";
import { BrandMark } from "./BrandMark";
import "./AppShell.scss";

const expandedWidth = 264;
const collapsedWidth = 76;

const routes = [
  { path: "/summary", label: "Summary", icon: <SpaceDashboardRounded /> },
  { path: "/accounts", label: "Accounts", icon: <AccountBalanceRounded /> },
  { path: "/transactions", label: "Transactions", icon: <ReceiptLongRounded /> },
  { path: "/categories", label: "Categories", icon: <CategoryRounded /> },
  { path: "/budget", label: "Budget", icon: <AccountBalanceWalletRounded /> },
] as const;

export function AppShell({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const { status, logout } = useAuth();
  const [connectOpen, setConnectOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("financeSidebarCollapsed") === "true",
  );
  const drawerWidth = sidebarCollapsed ? collapsedWidth : expandedWidth;

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      localStorage.setItem("financeSidebarCollapsed", String(!current));
      return !current;
    });
  };

  return (
    <Box className="app-shell">
      {desktop ? (
        <Drawer
          variant="permanent"
          open
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              overflowX: "hidden",
              borderRight: "1px solid rgba(255,255,255,.08)",
              color: "white",
              backgroundColor: "#123b31",
              backgroundImage: "radial-gradient(circle at 18% 0%, rgba(117,184,159,.16), transparent 32%), linear-gradient(180deg, #123b31 0%, #0d2f27 100%)",
              transition: theme.transitions.create("width", { duration: theme.transitions.duration.shorter }),
            },
          }}
        >
          <Box className="app-shell__drawer-content" sx={{ px: sidebarCollapsed ? 1 : 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent={sidebarCollapsed ? "center" : "space-between"} gap={1} px={0.75}>
              <BrandMark inverse compact={sidebarCollapsed} />
              {!sidebarCollapsed && (
                <Tooltip title="Collapse navigation" placement="right">
                  <IconButton className="app-shell__drawer-action" aria-label="Collapse navigation" onClick={toggleSidebar}>
                    <ChevronLeftRounded />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            {sidebarCollapsed && (
              <Tooltip title="Expand navigation" placement="right">
                <IconButton className="app-shell__drawer-action app-shell__drawer-expand" aria-label="Expand navigation" onClick={toggleSidebar}>
                  <ChevronRightRounded />
                </IconButton>
              </Tooltip>
            )}

            {!sidebarCollapsed && <Typography className="app-shell__overline" variant="overline">Workspace</Typography>}
            <List component="nav" aria-label="Main navigation" sx={{ mt: sidebarCollapsed ? 2 : 0.5, px: 0, display: "grid", gap: 0.5 }}>
              {routes.map((route) => {
                const selected = location.pathname === route.path;
                const item = (
                  <ListItemButton
                    component={NavLink}
                    to={route.path}
                    selected={selected}
                    sx={{
                      minHeight: 44,
                      px: sidebarCollapsed ? 0 : 1.5,
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      borderRadius: 2.5,
                      color: "rgba(255,255,255,.72)",
                      textDecoration: "none",
                      "&:hover": { color: "white", backgroundColor: "rgba(255,255,255,.08)" },
                      "&.Mui-selected": { color: "white", backgroundColor: "rgba(255,255,255,.13)" },
                      "&.Mui-selected:hover": { backgroundColor: "rgba(255,255,255,.16)" },
                      "&.Mui-selected .MuiListItemIcon-root": { color: "#e1b06f" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: sidebarCollapsed ? 0 : 38, color: "inherit", justifyContent: "center" }}>
                      {route.icon}
                    </ListItemIcon>
                    {!sidebarCollapsed && <ListItemText primary={route.label} primaryTypographyProps={{ fontSize: ".93rem", fontWeight: 700 }} />}
                  </ListItemButton>
                );
                return sidebarCollapsed
                  ? <Tooltip key={route.path} title={route.label} placement="right">{item}</Tooltip>
                  : <Box key={route.path}>{item}</Box>;
              })}
            </List>

            <Box className="app-shell__account">
              <Divider sx={{ borderColor: "rgba(255,255,255,.1)", mb: 1.5 }} />
              {sidebarCollapsed ? (
                <Tooltip title="Connect bank" placement="right">
                  <IconButton className="app-shell__connect-icon" aria-label="Connect bank" onClick={() => setConnectOpen(true)}>
                    <AddRounded />
                  </IconButton>
                </Tooltip>
              ) : (
                <Button fullWidth variant="contained" color="secondary" startIcon={<AddRounded />} onClick={() => setConnectOpen(true)}>
                  Connect bank
                </Button>
              )}
              <Stack direction={sidebarCollapsed ? "column" : "row"} alignItems="center" spacing={sidebarCollapsed ? 0.5 : 1} mt={1.5}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: "rgba(255,255,255,.14)", color: "white" }}>
                  {status?.displayName.charAt(0).toUpperCase() ?? "F"}
                </Avatar>
                {!sidebarCollapsed && (
                  <Box className="app-shell__profile-copy">
                    <Typography color="white" fontWeight={700} noWrap>{status?.displayName ?? "Finance admin"}</Typography>
                    <Typography variant="caption" noWrap sx={{ display: "block", color: "rgba(255,255,255,.62)" }}>{status?.email}</Typography>
                  </Box>
                )}
                <Stack direction={sidebarCollapsed ? "column" : "row"} spacing={0} ml={sidebarCollapsed ? 0 : "auto"}>
                  <Tooltip title={darkMode ? "Use light mode" : "Use dark mode"} placement="top">
                    <IconButton aria-label={darkMode ? "Use light mode" : "Use dark mode"} onClick={onToggleTheme} sx={{ color: "rgba(255,255,255,.82)" }}>
                      {darkMode ? <LightModeRounded /> : <DarkModeRounded />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sign out" placement="top">
                    <IconButton aria-label="Sign out" onClick={() => void logout()} sx={{ color: "rgba(255,255,255,.82)" }}>
                      <LogoutRounded />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Drawer>
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
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Main navigation"
            sx={{
              mt: 0.75,
              color: "white",
              "& .MuiTabs-indicator": { backgroundColor: "#e1b06f", height: 3 },
              "& .MuiTab-root": { minWidth: 100, color: "rgba(255,255,255,.66)", opacity: 1 },
              "& .MuiTab-root.Mui-selected": { color: "#fff" },
              "& .MuiTabs-scrollButtons": { color: "rgba(255,255,255,.8)" },
            }}
          >
            {routes.map((route) => <Tab key={route.path} value={route.path} label={route.label} />)}
          </Tabs>
        </header>
      )}
      <Box component="main" className="app-shell__main" sx={{ ml: desktop ? `${drawerWidth}px` : 0 }}><Outlet /></Box>
      <ConnectBankDialog open={connectOpen} onClose={() => setConnectOpen(false)} />
    </Box>
  );
}
