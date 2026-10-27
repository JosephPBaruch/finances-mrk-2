import { Alert, Snackbar } from "@mui/material";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Severity = "success" | "info" | "warning" | "error";

type NotificationContextValue = {
  notify: (message: string, severity?: Severity) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<{ message: string; severity: Severity } | null>(null);
  const notify = useCallback((message: string, severity: Severity = "info") => {
    setNotification({ message, severity });
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={notification !== null}
        autoHideDuration={notification?.severity === "error" ? 8000 : 5000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={(_, reason) => {
          if (reason !== "clickaway") setNotification(null);
        }}
      >
        <Alert
          variant="filled"
          severity={notification?.severity ?? "info"}
          onClose={() => setNotification(null)}
          sx={{ minWidth: 300 }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used inside NotificationProvider.");
  return context;
}
