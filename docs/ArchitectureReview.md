# Architecture review

## Result

The existing controller/service/data split is appropriate for this application's size and has been retained. The frontend is organized by business feature, with shared transport and app-wide state at the edges. The implementation does not need a repository layer, command bus, or global state library yet; those would add indirection without removing current duplication.

## Backend boundaries

- `Controllers/` owns HTTP contracts, validation, authorization, and current-user scoping.
- `Services/` owns Plaid orchestration, encryption, password hashing, authentication identity resolution, and transaction synchronization.
- `Data/` owns EF Core configuration and migrations.
- `Models/` contains persistence entities only.
- `DTOs/` prevents persistence and security fields from leaking into responses.
- Cookie authentication uses one seeded admin identity. There is no registration, public password reset, or client-supplied user ID.

The database unique indexes remain the source of truth for duplicate Plaid Items, accounts, and transactions. The frontend additionally de-duplicates account response payloads by application account ID so repeated or mixed legacy responses cannot render duplicate cards.

## Frontend boundaries

- `app/` owns routing, the authenticated shell, theme, and shared finance-data loading.
- `features/accounts/` owns account classification, balance/net-worth calculations, and account presentation.
- `features/transactions/` owns transaction transport normalization, confidence rules, review, filtering, and assignment UI.
- `features/budgets/` owns browser-local monthly planning and Plaid-to-budget mapping.
- `features/projections/` owns deterministic projection math and its assumptions UI.
- `features/auth/` owns the admin session bootstrap and login experience.
- `shared/api/` owns HTTP error handling and API contracts.

Calculations that are used by more than one screen are pure functions with unit tests. Page components coordinate data and interaction but do not duplicate accounting rules.

## Intentional constraints

- Budget goals and Plaid-category mapping overrides remain in browser storage. Moving them to the API should be the next persistence change if multiple devices are required.
- Wealth projection is a planning estimate. It models a constant monthly contribution, constant annual return, and constant inflation; it does not model taxes, fees, volatility, or account-specific withdrawal rules.
- The app is intentionally single-admin. Supporting multiple users would require replacing the bootstrap flow, adding user lifecycle operations, and reviewing every ownership policy.
- Plaid `/accounts/get` balances are cached by Plaid. Real-time balance retrieval may require product access and can have usage cost.

## Verification expectations

Changes should keep the following checks green:

```bash
dotnet test FinanceApp.slnx
cd src/FinanceApp.Web
npm run typecheck
npm run test
npm run build
npm run test:e2e
```
