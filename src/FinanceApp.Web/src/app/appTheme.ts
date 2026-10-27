import { createTheme, type PaletteMode } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? "#75B89F" : "#174C3C" },
      secondary: { main: dark ? "#D9A96C" : "#C48A4A" },
      background: { default: dark ? "#0E1714" : "#F3F5F1", paper: dark ? "#17221E" : "#FFFEFB" },
      text: { primary: dark ? "#EDF3EF" : "#18231F", secondary: dark ? "#AAB7B1" : "#66736D" },
      divider: dark ? "#2B3934" : "#DDE3DE",
      success: { main: dark ? "#67B98D" : "#2F7D5A" },
      warning: { main: dark ? "#E1B86E" : "#A96820" },
      error: { main: dark ? "#EE8C85" : "#B74B45" },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: { fontWeight: 760, letterSpacing: "-0.04em" },
      h2: { fontWeight: 730, letterSpacing: "-0.035em" },
      h3: { fontWeight: 700, letterSpacing: "-0.025em" },
      h4: { fontWeight: 700, letterSpacing: "-0.02em" },
      button: { fontWeight: 700, textTransform: "none" },
    },
    components: {
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: "none" } },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${dark ? "#2B3934" : "#DDE3DE"}`,
            boxShadow: dark ? "0 16px 48px rgba(0,0,0,.15)" : "0 14px 36px rgba(27,49,41,.06)",
          },
        },
      },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 9 } } },
      MuiTextField: { defaultProps: { size: "small" } },
      MuiChip: { styleOverrides: { root: { fontWeight: 650 } } },
    },
  });
}
