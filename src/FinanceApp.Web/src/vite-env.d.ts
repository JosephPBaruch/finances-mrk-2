/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_PLAID_CONNECTION_MODE?: "link" | "sandbox" | "both";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
