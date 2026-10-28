import { expect, test } from "@playwright/test";

const emptyApi = async (page: import("@playwright/test").Page) => {
  await page.route("**/api/auth/status", (route) => route.fulfill({ json: { isAuthenticated: true, needsSetup: false, email: "admin@example.com", displayName: "Finance Admin" } }));
  await page.route("**/api/connections", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/accounts", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/categories", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/transactions**", (route) => route.fulfill({ json: { items: [], page: 1, pageSize: 200, totalCount: 0, totalPages: 0 } }));
};

test.beforeEach(async ({ page }) => {
  await emptyApi(page);
});

for (const [path, heading] of [["/summary", "Summary"], ["/accounts", "Accounts"], ["/transactions", "Transactions"], ["/categories", "Categories"], ["/budget", "Budget"]] as const) {
  test(`${heading} route renders`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  });
}

test("budget exposes the core monthly controls", async ({ page }) => {
  await page.goto("/budget");
  await expect(page.getByText(/Monthly Income —/)).toBeVisible();
  await expect(page.getByText(/Budget Goals —/)).toBeVisible();
  await expect(page.getByText("Total outflow vs. income")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
});

test("first run requires the admin to create a password", async ({ page }) => {
  await page.unroute("**/api/auth/status");
  await page.route("**/api/auth/status", (route) => route.fulfill({
    json: { isAuthenticated: false, needsSetup: true, email: "developer@financeapp.local", displayName: "Finance Admin" },
  }));

  await page.goto("/summary");

  await expect(page.getByRole("heading", { name: "Create your admin password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Secure my account" })).toBeVisible();
});

test("desktop navigation uses the compact MUI drawer styling", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop-only drawer assertion");
  await page.goto("/summary");

  const drawer = page.locator(".MuiDrawer-paper");
  await expect(drawer).toBeVisible();
  expect((await drawer.boundingBox())?.width).toBeLessThanOrEqual(265);
  const summaryLink = page.getByRole("link", { name: "Summary" });
  await expect(summaryLink).toHaveCSS("text-decoration-line", "none");
  await expect(summaryLink).not.toHaveCSS("color", "rgb(0, 0, 238)");
  await expect(page.getByRole("link", { name: "Budget" })).toBeVisible();
});

test("mobile tabs keep explicit selected colors", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only tab assertion");
  await page.goto("/summary");
  await expect(page.getByRole("tab", { name: "Summary" })).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.getByRole("tab", { name: "Accounts" })).not.toHaveCSS("color", "rgb(0, 0, 238)");
});

test("accounts are grouped by connection and disconnection requires confirmation", async ({ page }) => {
  let connected = true;
  const account = {
    accountId: "account-1", bankConnectionId: "connection-1", name: "Primary Checking", officialName: null,
    type: "depository", subtype: "checking", mask: "1234", currentBalance: 1250, availableBalance: 1200,
    currencyCode: "USD", updatedAt: "2026-10-27T00:00:00Z",
  };
  const connection = {
    bankConnectionId: "connection-1", institutionId: "ins_1", institutionName: "Test Credit Union", status: "Active",
    lastSuccessfulSyncAt: null, createdAt: "2026-10-27T00:00:00Z", updatedAt: "2026-10-27T00:00:00Z", accounts: [account],
  };
  await page.unroute("**/api/connections");
  await page.unroute("**/api/accounts");
  await page.route("**/api/connections/connection-1", async (route) => {
    if (route.request().method() === "DELETE") {
      connected = false;
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fallback();
  });
  await page.route("**/api/connections", (route) => route.fulfill({ json: connected ? [connection] : [] }));
  await page.route("**/api/accounts", (route) => route.fulfill({ json: connected ? [account] : [] }));

  await page.goto("/accounts");
  await expect(page.getByText("Test Credit Union").first()).toBeVisible();
  await expect(page.getByText("Primary Checking")).toBeVisible();
  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(page.getByRole("dialog")).toContainText("cannot be undone");
  await page.getByRole("button", { name: "Disconnect and delete" }).click();
  await expect(page.getByText("Test Credit Union")).toHaveCount(0);
});

test("legacy API transaction identifiers render with independent resolution", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/transactions**", (route) => route.fulfill({
    json: {
      items: [{
        id: "d85cf52e-3951-4e08-a806-df2f3f54de20",
        financialAccountId: "9f549322-188a-460d-8729-5c144064ca40",
        plaidTransactionId: "plaid-transaction",
        date: "2026-10-26",
        authorizedDate: null,
        name: "United Airlines",
        merchantName: "United Airlines",
        amount: 500,
        currencyCode: "USD",
        pending: false,
        plaidPrimaryCategory: "TRAVEL",
        plaidDetailedCategory: "TRAVEL_FLIGHTS",
        plaidCategoryConfidence: "VERY_HIGH",
        userCategoryId: null,
        userCategoryName: null,
        userCategoryBudgetBucket: null,
        isReviewed: false,
        isResolved: false,
        notes: null,
        updatedAt: "2026-10-27T02:26:40.241599+00:00",
      }],
      page: 1,
      pageSize: 200,
      totalCount: 1,
      totalPages: 1,
    },
  }));

  await page.goto("/transactions");

  await expect(page.getByText("United Airlines").first()).toBeVisible();
  if (testInfo.project.name === "chromium") {
    await expect(page.getByRole("button", { name: "Mark resolved" })).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});
