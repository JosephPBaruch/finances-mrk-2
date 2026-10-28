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

for (const [path, heading] of [["/summary", "Summary"], ["/accounts", "Accounts"], ["/transactions", "Transactions"], ["/categories", "Categories"], ["/budget", "Budget"], ["/projection", "Wealth projection"]] as const) {
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

test("legacy API transaction identifiers render without a Data Grid error", async ({ page }) => {
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
        isReviewed: false,
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
  expect(pageErrors).toEqual([]);
});
