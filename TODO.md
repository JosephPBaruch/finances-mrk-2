# Completed TODOs

- [x] Exclude generated .NET/frontend output, SQLite sidecars, reports, and dependencies from VS Code file watching and search.
- [x] Polish the frontend side drawer and make its compact state collapsible, accessible, responsive, and persistent.
- [x] Review the architecture and organization. See `docs/ArchitectureReview.md` for boundaries, decisions, and intentional constraints.
- [x] Fix quadrupled account rendering by de-duplicating normalized account payloads by stable application account ID.
- [x] Show the account name and masked suffix in the transaction grid.
- [x] Support friendly presentation of checking/debit, credit, Venmo/digital wallets, savings/HYSA, 401(k), brokerage/investment, loan, and unknown future account types.
- [x] Add an Accounts overview with net worth, assets, liabilities, current/available balances, filters, institutions, and balance refresh.
- [x] Add Plaid confidence review: low/unknown confidence flags, optional category assignment, Plaid-default behavior, row highlighting, and confidence/review filters.
- [x] Apply recommended percentages to new monthly budgets, persist per-category override metadata, label recommended/custom goals, and allow restoring defaults.
- [x] Expand Summary with API-aligned net worth, assets, liabilities, monthly inflow/outflow, net cash flow, transaction totals, and review exceptions.
- [x] Add a Wealth Projection tab with live starting net worth, recent-cash-flow suggestion, editable assumptions, target timing, and nominal/real charts.
- [x] Add single-admin authentication with one-time password setup, PBKDF2 hashing, HTTP-only cookie sessions, protected APIs, sign-in/out UI, migration, and database-only reset documentation.
- TASK: Add a favicon based on the theme which is just the letter F in the correct font.

## Key

BUG = Something to Fix
TASK = Something small to add/improve
STORY = A new feature to add that isn't currently represented
EPIC = A large feature to add that is a substantial effore
