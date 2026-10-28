export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

export type Account = {
  accountId: string;
  bankConnectionId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  currencyCode: string | null;
  updatedAt: string;
};

export type BankConnection = {
  bankConnectionId: string;
  institutionId: string | null;
  institutionName: string | null;
  status: "Active" | "Error" | "RequiresUpdate" | string;
  lastSuccessfulSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
  accounts: Account[];
};

export type FinanceTransaction = {
  transactionId: string;
  accountId: string;
  plaidTransactionId: string;
  date: string;
  authorizedDate: string | null;
  name: string;
  merchantName: string | null;
  amount: number;
  currencyCode: string | null;
  pending: boolean;
  plaidPrimaryCategory: string | null;
  plaidDetailedCategory: string | null;
  plaidCategoryConfidence: string | null;
  userCategoryId: string | null;
  userCategoryName: string | null;
  userCategoryBudgetBucket: string | null;
  isReviewed: boolean;
  isResolved: boolean;
  notes: string | null;
  updatedAt: string;
};

export type UserCategory = {
  categoryId: string;
  name: string;
  description: string | null;
  budgetBucket: string | null;
};

export type AuthStatus = {
  isAuthenticated: boolean;
  needsSetup: boolean;
  email: string;
  displayName: string;
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type ConnectionCreatedResponse = {
  bankConnectionId: string;
  institutionName: string | null;
  accountCount: number;
};

export type LinkTokenResponse = {
  linkToken: string;
  expiration: string;
};

export type SyncResponse = {
  added: number;
  modified: number;
  removed: number;
  lastSyncAt: string;
  hasMore: boolean;
};

export type SyncAllResponse = {
  results: Array<{
    bankConnectionId: string;
    succeeded: boolean;
    statistics: SyncResponse | null;
    error: string | null;
  }>;
};
