import type {
  Account,
  BankConnection,
  ConnectionCreatedResponse,
  LinkTokenResponse,
  SyncAllResponse,
  SyncResponse,
} from "../../shared/api/apiTypes";
import { apiRequest } from "../../shared/api/http";

export const bankingApi = {
  getConnections: () => apiRequest<BankConnection[]>("/connections"),
  getAccounts: () => apiRequest<Account[]>("/accounts"),
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
