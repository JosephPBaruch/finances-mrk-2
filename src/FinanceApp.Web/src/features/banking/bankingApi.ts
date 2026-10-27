import type {
  ConnectionCreatedResponse,
  LinkTokenResponse,
  SyncAllResponse,
  SyncResponse,
} from "../../shared/api/apiTypes";
import { apiRequest } from "../../shared/api/http";
import { normalizeAccount, normalizeConnection, type AccountWire, type BankConnectionWire } from "./bankingAdapter";

export const bankingApi = {
  getConnections: () => apiRequest<BankConnectionWire[]>("/connections").then((items) => items.map(normalizeConnection)),
  getAccounts: () => apiRequest<AccountWire[]>("/accounts").then((items) => items.map(normalizeAccount)),
  createLinkToken: () => apiRequest<LinkTokenResponse>("/plaid/link-token", { method: "POST" }),
  exchangePublicToken: (publicToken: string) =>
    apiRequest<ConnectionCreatedResponse>("/plaid/exchange-token", {
      method: "POST",
      body: { publicToken },
    }),
  connectSandbox: (institutionId = "ins_109508") =>
    apiRequest<ConnectionCreatedResponse>("/plaid/sandbox/connect", {
      method: "POST",
      body: { institutionId },
    }),
  syncConnection: (bankConnectionId: string) =>
    apiRequest<SyncResponse>(`/connections/${bankConnectionId}/sync`, { method: "POST" }),
  syncAll: () => apiRequest<SyncAllResponse>("/connections/sync-all", { method: "POST" }),
};
