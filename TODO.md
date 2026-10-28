# Completed TODOs

- [x] Exclude generated .NET/frontend output, SQLite sidecars, reports, and dependencies from VS Code file watching and search.
- [x] Replace the custom sidebar with an MUI Drawer and make its compact state collapsible, accessible, responsive, correctly themed, and persistent.
- [x] Review the architecture and organization. See `docs/ArchitectureReview.md` for boundaries, decisions, and intentional constraints.
- [x] Fix quadrupled account rendering by de-duplicating normalized account payloads by stable application account ID.
- [x] Show the account name and masked suffix in the transaction grid.
- [x] Support friendly presentation of checking/debit, credit, Venmo/digital wallets, savings/HYSA, 401(k), brokerage/investment, loan, and unknown future account types.
- [x] Add an Accounts overview grouped by Plaid connection with net worth, balances, filters, refresh, and confirmed connection removal.
- [x] Add Plaid confidence review: low/unknown confidence flags, real transaction categories, one-click Plaid acceptance, row highlighting, and confidence/review filters.
- [x] Add an independent persisted transaction Resolved column that is not tied to category review.
- [x] Apply recommended percentages to new monthly budgets, persist per-category override metadata, label recommended/custom goals, and allow restoring defaults.
- [x] Highlight budget summary rows by outcome, with savings goals favorable when actual savings meet or exceed the goal.
- [x] Expand Summary with API-aligned net worth, assets, liabilities, monthly inflow/outflow, net cash flow, transaction totals, and review exceptions.
- [x] Remove the Wealth Projection experiment because its assumptions made the page confusing and unreliable.
- [x] Add Income as a transaction category and feed Plaid Income/Transfer In transactions into monthly budget income.
- [x] Add single-admin authentication with one-time password setup, PBKDF2 hashing, HTTP-only cookie sessions, protected APIs, sign-in/out UI, migration, and database-only reset documentation.
- TASK: Add a favicon based on the theme which is just the letter F in the correct font.
- [ ] EPIC: Have the ability to make transaction rules. this should be intentionally dynamic to allow for the user to set things they want, for instance, if a transaction comes in that income, it should always match to the rule and be categorized correctly. Another example is always setting resolved for transactions from specific instituitions. this should be a new tab
- [ ] STORY: Allow multi-row marking/selecting. Also, make the table only go to the bottom of the page. There should only be scrolling in the table, not both the page and the table. 
- [ ] STORY: Have the ability to create more custom categories if you wish (not budget buckets)
- [ ] TASK: Auto sign out after 10 min inactive

## Key

BUG = Something to Fix
TASK = Something small to add/improve
STORY = A new feature to add that isn't currently represented
EPIC = A large feature to add that is a substantial effore
