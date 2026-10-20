# Finance App — Phase 1 Backend

Controller-based ASP.NET Core Web API for a personal finance application. Phase 1 provides a SQLite persistence layer, encrypted Plaid Item tokens, Plaid Sandbox onboarding, account retrieval, cursor-based transaction synchronization, transaction review metadata, Swagger UI, tests, and Docker support.

Frontend, budgeting, login, background jobs, and mobile clients are intentionally out of scope.

## Architecture

The API is one deployable service, split into straightforward layers:

- `Controllers/` — HTTP endpoints and current-user scoping
- `Services/` — Plaid HTTP client, connection orchestration, encryption, and transaction synchronization
- `Data/` — EF Core context, development-user seed, and migrations
- `Models/` — database entities and relationships
- `DTOs/` — request/response contracts; sensitive entity fields never appear in API responses
- `Configuration/` — strongly typed Plaid and encryption settings
- `Middleware/` — centralized, safe RFC 7807 ProblemDetails responses

Every request is scoped through `ICurrentUserService`. `DevelopmentCurrentUserService` resolves the automatically seeded development user; controllers never accept an unauthenticated user ID. `BankConnection` represents one Plaid Item and can own many accounts.

Access tokens are encrypted with AES-256-GCM using a configuration-supplied key. Transaction synchronization collects all Plaid pages before starting one EF transaction. Transaction changes and the final cursor therefore commit atomically. Removed rows are archived with `IsRemoved`/`RemovedAt`, and Plaid updates never replace `UserCategoryId`, `IsReviewed`, or `Notes`.

## Technology

- .NET 10 / C# / ASP.NET Core controllers
- EF Core 10 with SQLite
- Typed `HttpClient` for the Plaid REST API
- Swashbuckle Swagger UI in Development only
- xUnit v3 tests using in-memory SQLite and mocked Plaid behavior
- Multi-stage Docker image running as the built-in non-root .NET user

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
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
dotnet user-secrets --project src/FinanceApp.Api set "Encryption:Key" "BASE64_KEY_FROM_OPENSSL"
```

The same values can be supplied with .NET environment-variable names:

```text
Plaid__ClientId
Plaid__Secret
Plaid__Environment=sandbox
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

The initial migration seeds `developer@financeapp.local`. Application code resolves that row through `ICurrentUserService`.

## Run and use Swagger

```bash
dotnet run --project src/FinanceApp.Api
```

Open the `/swagger` URL printed by ASP.NET Core (typically `http://localhost:5xxx/swagger`). Swagger is deliberately disabled outside Development.

### Complete Sandbox flow

1. Call `POST /api/plaid/sandbox/connect` with `ins_109508` (Plaid's First Platypus Bank Sandbox institution).
2. Copy the returned `bankConnectionId`.
3. Call `GET /api/accounts`.
4. Call `POST /api/connections/{id}/sync`. Connection creation already performs the required first sync; calling it again retrieves any history Plaid prepared asynchronously.
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

`GET /api/transactions` accepts `accountId`, `startDate`, `endDate`, `categoryId`, `isReviewed`, `pending`, `page`, and `pageSize` (maximum 200). Archived Plaid removals are excluded. `PATCH /api/transactions/{id}` accepts only `userCategoryId`, `isReviewed`, and `notes`; amount and Plaid identifiers cannot be changed.

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
```

The test suite requires no Plaid credentials and covers safe public-token exchange errors, connection/account persistence, token encryption, initial and incremental sync, pagination, added/modified/removed records, pending-to-posted replacement, user-metadata preservation, cursor persistence, rollback, mutation-during-pagination restart, and duplicate prevention.

## Docker

Create an untracked `.env` file or export these variables in your shell:

```text
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENVIRONMENT=sandbox
ENCRYPTION_KEY=BASE64_ENCODED_32_BYTE_KEY
```

Then run:

```bash
docker compose up --build
```

Swagger is at `http://localhost:8080/swagger`. SQLite is stored in the named `finance-data` volume and survives container recreation. A short-lived Alpine init service assigns the volume directory to UID/GID `1654`, the built-in .NET image application user; the API itself never runs as root. Credentials and the encryption key are injected at runtime and are not copied into the image.

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

## Future authentication

Replace `DevelopmentCurrentUserService` with an implementation backed by ASP.NET Core Identity or validated JWT claims, register it as `ICurrentUserService`, and add authorization policies to controllers. Existing queries and services already scope data by the resolved user, so clients will not start passing arbitrary user IDs. Before production, also remove the development user seed through a migration and secure every endpoint, especially token exchange and Link-token creation.

## Future React and iOS clients

Clients should request `POST /api/plaid/link-token`, launch the appropriate Plaid Link SDK, and send the resulting public token to `POST /api/plaid/exchange-token`. They should consume only DTOs from this API; Plaid secrets and access tokens remain server-side. CORS, frontend hosting, client authentication, webhook-triggered refresh notifications, and mobile deep-link/OAuth handling belong in later phases.
