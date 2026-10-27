# Helper Notes

## Connecting

```sh
ASPNETCORE_ENVIRONMENT=Development \
dotnet run --project src/FinanceApp.Api -- --urls http://localhost:5000
```

Then go to: `http://localhost:5000/swagger`.

## Mock Data

Use the `/api/plaid/sandbox/connect` endpoint and pass: 

```json
{
  "institutionId": "ins_109508"
}
```