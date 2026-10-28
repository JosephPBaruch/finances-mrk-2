# Finances — Personal Finance App

Full-stack personal finance and budgeting application. The ASP.NET Core API provides single-admin authentication, encrypted Plaid Item storage, Sandbox and Link onboarding, account retrieval, cursor-based transaction synchronization, review metadata, and SQLite persistence. The React application adds account/net-worth overviews, responsive summaries, transaction review, confidence-aware category assignment, monthly goals, income planning, wealth projections, charts, and a five-bucket budget.

## Architecture

The backend is split into straightforward layers:

- `Controllers/` — HTTP endpoints and current-user scoping
- `Services/` — Plaid HTTP client, connection orchestration, encryption, and transaction synchronization
- `Data/` — EF Core context, development-user seed, and migrations
- `Models/` — database entities and relationships
- `DTOs/` — request/response contracts; sensitive entity fields never appear in API responses
- `Configuration/` — strongly typed Plaid and encryption settings
- `Middleware/` — centralized, safe RFC 7807 ProblemDetails responses

Every protected request is scoped through `ICurrentUserService`. `AuthenticatedCurrentUserService` resolves the signed-in admin from a server-issued HTTP-only cookie; controllers never accept a user ID from the client. `BankConnection` represents one Plaid Item and can own many accounts.

Access tokens are encrypted with AES-256-GCM using a configuration-supplied key. Transaction synchronization collects all Plaid pages before starting one EF transaction. Transaction changes and the final cursor therefore commit atomically. Removed rows are archived with `IsRemoved`/`RemovedAt`, and Plaid updates never replace `UserCategoryId`, `IsReviewed`, or `Notes`.

The frontend lives in `src/FinanceApp.Web`. Backend behavior is isolated behind typed API modules. Budget goals, monthly income overrides, and Plaid-category mapping preferences are currently browser-local because the API does not yet expose persistence endpoints for them.

## Technology

- .NET 10 / C# / ASP.NET Core controllers
- EF Core 10 with SQLite
- Typed `HttpClient` for the Plaid REST API
- Swashbuckle Swagger UI in Development only
- xUnit v3 tests using in-memory SQLite and mocked Plaid behavior
- Multi-stage Docker image running as the built-in non-root .NET user
- React 19, Vite, strict TypeScript, Material UI, MUI X Data Grid, Recharts, and SCSS
- React Plaid Link for institution authentication
- Vitest, Testing Library, and Playwright desktop/mobile coverage
- Node 22 Alpine and Nginx Alpine multi-stage frontend image

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- Node.js 22 for local frontend development
- A [Plaid developer account](https://dashboard.plaid.com/signup) with Sandbox credentials
- Optional: Docker and Docker Compose
- Optional: `sqlite3` for inspecting the database

## Local setup

Restore tools/packages and create a 32-byte encryption key:

```bash
dotnet tool restore
dotnet restore FinanceApp.slnx
openssl rand -base64 32
```

Store development secrets outside source control:

```bash
dotnet user-secrets --project src/FinanceApp.Api set "Plaid:ClientId" "YOUR_CLIENT_ID"
dotnet user-secrets --project src/FinanceApp.Api set "Plaid:Secret" "YOUR_SANDBOX_SECRET"
dotnet user-secrets --project src/FinanceApp.Api set "Plaid:Environment" "sandbox"
# Required for production OAuth institutions; register this exact URI in Plaid Dashboard.
dotnet user-secrets --project src/FinanceApp.Api set "Plaid:RedirectUri" "http://localhost:5173/transactions"
dotnet user-secrets --project src/FinanceApp.Api set "Encryption:Key" "BASE64_KEY_FROM_OPENSSL"
```

The same values can be supplied with .NET environment-variable names:

```text
Plaid__ClientId
Plaid__Secret
Plaid__Environment=sandbox
Plaid__RedirectUri=http://localhost:5173/transactions
Plaid__Products__0=transactions
Plaid__CountryCodes__0=US
Encryption__Key
ConnectionStrings__FinanceDatabase=Data Source=storage/finance.db
```

Do not reuse the example/test encryption key from tests. Back up the real key: losing it makes stored access tokens unrecoverable. Changing it requires a deliberate token re-encryption procedure, which Phase 1 does not implement.

## Database migrations

The app calls `MigrateAsync` at startup; it does not use `EnsureCreated`. To manage migrations explicitly:

```bash
# Apply migrations
dotnet ef database update --project src/FinanceApp.Api --startup-project src/FinanceApp.Api

# Add a migration after changing the model
dotnet ef migrations add MigrationName \
  --project src/FinanceApp.Api \
  --startup-project src/FinanceApp.Api \
  --output-dir Data/Migrations

# Reset the local development database (destructive)
rm -f src/FinanceApp.Api/storage/finance.db src/FinanceApp.Api/storage/finance.db-shm src/FinanceApp.Api/storage/finance.db-wal
dotnet ef database update --project src/FinanceApp.Api --startup-project src/FinanceApp.Api
```

The initial migration seeds `developer@financeapp.local`; the authentication migration marks it as the single admin. On first launch, the web app asks the admin to set a password before exposing financial data.

## Single-admin authentication

The application intentionally has no registration or password-change endpoint. On the first visit, the seeded admin sets a password of at least 12 characters. The API stores only a salted PBKDF2-SHA256 hash and starts a 14-day, HTTP-only, same-site cookie session.

To authorize a password reset, update the database directly while the API is stopped:

```bash
sqlite3 src/FinanceApp.Api/storage/finance.db \
  "UPDATE Users SET PasswordHash = NULL, PasswordSetAt = NULL WHERE IsAdmin = 1;"
```

Restart the API on a trusted/local network and immediately complete the one-time setup screen again. Resetting these fields temporarily re-enables initial setup, so do not leave an internet-accessible instance running in that state. The admin email/display name can also be changed directly in the `Users` table. There is deliberately no API route for changing the password after initial setup.

## Run and use Swagger

```bash
ASPNETCORE_ENVIRONMENT=Development \
dotnet run --project src/FinanceApp.Api -- --urls http://localhost:5000
```

Open the `/swagger` URL printed by ASP.NET Core (typically `http://localhost:5xxx/swagger`). Swagger is deliberately disabled outside Development.

## Run the frontend locally

With the API running on port 5000:

```bash
cd src/FinanceApp.Web
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `VITE_API_PROXY_TARGET`. Set `VITE_PLAID_CONNECTION_MODE` to `link`, `sandbox`, or `both` to control the available bank-connection choices at build time.

### Complete Sandbox flow

1. Call `POST /api/plaid/sandbox/connect` with `ins_109508` (Plaid's First Platypus Bank Sandbox institution).
2. Copy the returned `bankConnectionId`.
3. Call `GET /api/accounts`.
4. Call `POST /api/connections/{bankConnectionId}/sync`. Connection creation already performs the required first sync; calling it again retrieves any history Plaid prepared asynchronously.
5. Call `GET /api/transactions`.
6. Call `PATCH /api/transactions/{id}` with review metadata.
7. Query transactions again, for example with `isReviewed=true`.

The Sandbox shortcut returns 404 unless both `ASPNETCORE_ENVIRONMENT=Development` and `Plaid:Environment=sandbox`. It cannot be used in Production.

Equivalent curl commands (replace IDs and port):

```bash
BASE_URL=http://localhost:5000

curl -X POST "$BASE_URL/api/plaid/sandbox/connect" \
  -H 'Content-Type: application/json' \
  -d '{"institutionId":"ins_109508"}'

curl "$BASE_URL/api/accounts"
curl -X POST "$BASE_URL/api/connections/CONNECTION_ID/sync"
curl "$BASE_URL/api/transactions?page=1&pageSize=50&pending=false"

curl -X PATCH "$BASE_URL/api/transactions/TRANSACTION_ID" \
  -H 'Content-Type: application/json' \
  -d '{"isReviewed":true,"notes":"Reviewed in Swagger"}'
```

For a Link-created public token, use:

```bash
curl -X POST "$BASE_URL/api/plaid/link-token"
curl -X POST "$BASE_URL/api/plaid/exchange-token" \
  -H 'Content-Type: application/json' \
  -d '{"publicToken":"public-sandbox-..."}'
```

No endpoint returns the Plaid access token or encrypted token value.

## Querying and editing transactions

`GET /api/transactions` accepts `accountId`, `startDate`, `endDate`, `categoryId`, `isReviewed`, `pending`, `page`, and `pageSize` (maximum 200). Archived Plaid removals are excluded. `PATCH /api/transactions/{transactionId}` accepts only `userCategoryId`, `isReviewed`, and `notes`; amount and Plaid identifiers cannot be changed.

Category entities and relationships exist, but category-management endpoints are intentionally deferred. Until those are added, category IDs can only be assigned if a category row already exists for the development user.

## Inspecting SQLite

With the default local configuration:

```bash
sqlite3 src/FinanceApp.Api/storage/finance.db
```

Useful read-only commands:

```sql
.tables
.schema Transactions
SELECT Id, InstitutionName, Status, LastSuccessfulSyncAt FROM BankConnections;
SELECT Date, Name, Amount, Pending, IsReviewed, IsRemoved FROM Transactions ORDER BY Date DESC LIMIT 25;
```

The `AccessToken` column contains authenticated ciphertext, not plaintext. Treat the database and encryption key as secrets anyway.

## Tests

```bash
dotnet test FinanceApp.slnx
cd src/FinanceApp.Web
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

The test suite requires no Plaid credentials and covers safe public-token exchange errors, connection/account persistence, token encryption, initial and incremental sync, pagination, added/modified/removed records, pending-to-posted replacement, user-metadata preservation, cursor persistence, rollback, mutation-during-pagination restart, and duplicate prevention.

## Docker

Create an untracked `.env` file or export these variables in your shell:

```text
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENVIRONMENT=sandbox
PLAID_REDIRECT_URI=http://localhost:8080/transactions
ENCRYPTION_KEY=BASE64_ENCODED_32_BYTE_KEY
```

Then run:

```bash
docker compose up --build
```

The application is at `http://localhost:8080` and Swagger is at `http://localhost:8080/swagger`. The gateway is the only publicly exposed service; it routes `/` to the frontend and `/api/` to the backend. SQLite is stored in the named `finance-data` volume and survives container recreation. A short-lived Alpine init service assigns the volume directory to UID/GID `1654`, the built-in .NET image application user; the API itself never runs as root. Credentials and the encryption key are injected at runtime and are not copied into either image.

To reset the Docker database (destructive):

```bash
docker compose down -v
```

## Plaid behavior and Phase 1 limitations

- Plaid can return no transactions on the first `/transactions/sync` call while it prepares history. This API makes the first call during connection creation and supports later manual syncs. Plaid recommends `SYNC_UPDATES_AVAILABLE` webhooks for production automation; webhook/background processing is intentionally deferred. See [Plaid's sync migration guidance](https://plaid.com/docs/transactions/sync-migration/).
- Pagination restarts from the saved/original cursor on `TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION`, and local changes are saved only after all pages arrive. See the [Transactions API](https://plaid.com/docs/api/products/transactions/).
- `refresh-accounts` uses free `/accounts/get`, whose balances are cached as of Plaid's last Item update. Real-time `/accounts/balance/get` may have separate product access and usage billing, so Phase 1 does not call it. See the [Accounts API](https://plaid.com/docs/api/accounts/).
- `ins_109508` is a Sandbox-only test institution and does not imply that a similarly named production institution will work. See [Plaid Sandbox institutions](https://plaid.com/docs/sandbox/institutions/).
- Transaction amounts preserve Plaid's sign convention. The API does not infer income from sign.
- No webhook endpoint, automatic scheduler, delete/disconnect endpoint, key rotation, or production re-authentication Link flow is included yet.

## Frontend and future clients

The React client requests `POST /api/plaid/link-token`, launches Plaid Link, and sends the resulting public token to `POST /api/plaid/exchange-token`. It consumes only API DTOs; Plaid secrets and access tokens remain server-side. Webhook-triggered refresh notifications, durable server-side budget preferences, multi-user identity, and mobile deep-link/OAuth handling remain future work.
