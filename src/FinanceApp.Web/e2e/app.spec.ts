import { expect, test } from "@playwright/test";

const emptyApi = async (page: import("@playwright/test").Page) => {
  await page.route("**/api/connections", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/accounts", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/transactions**", (route) => route.fulfill({ json: { items: [], page: 1, pageSize: 200, totalCount: 0, totalPages: 0 } }));
};

test.beforeEach(async ({ page }) => {
  await emptyApi(page);
});

for (const [path, heading] of [["/summary", "Summary"], ["/transactions", "Transactions"], ["/categories", "Categories"], ["/budget", "Budget"]] as const) {
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
