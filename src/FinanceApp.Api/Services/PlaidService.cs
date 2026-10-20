using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FinanceApp.Api.Configuration;
using Microsoft.Extensions.Options;

namespace FinanceApp.Api.Services;

public sealed class PlaidService(HttpClient httpClient, IOptions<PlaidOptions> options, ILogger<PlaidService> logger) : IPlaidService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    private readonly PlaidOptions _options = options.Value;

    public async Task<PlaidLinkTokenResult> CreateLinkTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        var response = await PostAsync<LinkTokenResponse>("link/token/create", new
        {
            client_id = _options.ClientId,
            secret = _options.Secret,
            client_name = "Finance App",
            user = new { client_user_id = userId.ToString("D") },
            products = _options.Products,
            country_codes = _options.CountryCodes,
            language = "en"
        }, cancellationToken);

        return new PlaidLinkTokenResult(response.LinkToken, response.Expiration);
    }

    public async Task<PlaidExchangeResult> ExchangePublicTokenAsync(string publicToken, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        var response = await PostAsync<ExchangeResponse>("item/public_token/exchange", new
        {
            client_id = _options.ClientId,
            secret = _options.Secret,
            public_token = publicToken
        }, cancellationToken);
        return new PlaidExchangeResult(response.AccessToken, response.ItemId);
    }

    public async Task<string> CreateSandboxPublicTokenAsync(string institutionId, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        if (!_options.Environment.Equals("sandbox", StringComparison.OrdinalIgnoreCase))
            throw new ForbiddenOperationException("Sandbox connections are only available in the Sandbox environment.");

        var response = await PostAsync<SandboxTokenResponse>("sandbox/public_token/create", new
        {
            client_id = _options.ClientId,
            secret = _options.Secret,
            institution_id = institutionId,
            initial_products = _options.Products
        }, cancellationToken);
        return response.PublicToken;
    }

    public async Task<PlaidAccountsResult> GetAccountsAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        var response = await PostAsync<AccountsResponse>("accounts/get", AuthenticatedRequest(accessToken), cancellationToken);
        var accounts = response.Accounts.Select(x => new PlaidAccount(
            x.AccountId, x.Name, x.OfficialName, x.Type, x.Subtype, x.Mask,
            x.Balances.Current, x.Balances.Available, x.Balances.IsoCurrencyCode ?? x.Balances.UnofficialCurrencyCode)).ToArray();
        return new PlaidAccountsResult(response.Item.InstitutionId, response.Item.InstitutionName, accounts);
    }

    public async Task<PlaidSyncPage> SyncTransactionsAsync(string accessToken, string? cursor, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        var body = new Dictionary<string, object?>
        {
            ["client_id"] = _options.ClientId,
            ["secret"] = _options.Secret,
            ["access_token"] = accessToken,
            ["count"] = 500
        };
        if (cursor is not null) body["cursor"] = cursor;

        var response = await PostAsync<TransactionsSyncResponse>("transactions/sync", body, cancellationToken);
        static PlaidTransaction Map(TransactionData x) => new(
            x.TransactionId, x.AccountId, x.PendingTransactionId, x.Date, x.AuthorizedDate, x.Name,
            x.MerchantName, x.Amount, x.IsoCurrencyCode ?? x.UnofficialCurrencyCode, x.Pending,
            x.PersonalFinanceCategory?.Primary, x.PersonalFinanceCategory?.Detailed,
            x.PersonalFinanceCategory?.ConfidenceLevel);

        return new PlaidSyncPage(response.Added.Select(Map).ToArray(), response.Modified.Select(Map).ToArray(),
            response.Removed.Select(x => x.TransactionId).ToArray(), response.NextCursor, response.HasMore);
    }

    private object AuthenticatedRequest(string accessToken) => new
    {
        client_id = _options.ClientId,
        secret = _options.Secret,
        access_token = accessToken
    };

    private async Task<T> PostAsync<T>(string path, object body, CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync(path, body, JsonOptions, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken)
                ?? throw new PlaidApiException("INVALID_RESPONSE", "API_ERROR", "Plaid returned an empty response.");
        }

        PlaidErrorResponse? error = null;
        try { error = await response.Content.ReadFromJsonAsync<PlaidErrorResponse>(JsonOptions, cancellationToken); }
        catch (JsonException) { }

        logger.LogWarning("Plaid request {PlaidPath} failed with status {StatusCode}, code {ErrorCode}, request {RequestId}",
            path, (int)response.StatusCode, error?.ErrorCode, error?.RequestId);
        throw new PlaidApiException(error?.ErrorCode ?? "PLAID_HTTP_ERROR", error?.ErrorType ?? "API_ERROR",
            SafeErrorMessage(response.StatusCode, error), (int)response.StatusCode, error?.RequestId);
    }

    private static string SafeErrorMessage(HttpStatusCode status, PlaidErrorResponse? error) => error?.ErrorCode switch
    {
        "INVALID_PUBLIC_TOKEN" => "The Plaid public token is invalid or expired.",
        "INVALID_API_KEYS" => "Plaid credentials are invalid.",
        "ITEM_LOGIN_REQUIRED" => "The bank connection requires an update through Plaid Link.",
        "RATE_LIMIT_EXCEEDED" => "Plaid rate limit exceeded. Try again later.",
        "INSTITUTION_DOWN" => "The financial institution is temporarily unavailable.",
        "INSTITUTION_NOT_RESPONDING" => "The financial institution is not responding.",
        "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION" => "Plaid transaction data changed during pagination.",
        _ when status == HttpStatusCode.TooManyRequests => "Plaid rate limit exceeded. Try again later.",
        _ when (int)status >= 500 => "Plaid is temporarily unavailable.",
        _ => "The Plaid request could not be completed."
    };

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId) || string.IsNullOrWhiteSpace(_options.Secret))
            throw new PlaidApiException("PLAID_NOT_CONFIGURED", "CONFIGURATION_ERROR",
                "Plaid credentials are not configured.");
    }

    private sealed record LinkTokenResponse(
        [property: JsonPropertyName("link_token")] string LinkToken,
        [property: JsonPropertyName("expiration")] DateTimeOffset Expiration);
    private sealed record ExchangeResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("item_id")] string ItemId);
    private sealed record SandboxTokenResponse([property: JsonPropertyName("public_token")] string PublicToken);
    private sealed record AccountsResponse(IReadOnlyCollection<AccountData> Accounts, ItemData Item);
    private sealed record AccountData(string AccountId, string Name, string? OfficialName, string Type, string? Subtype, string? Mask, BalanceData Balances);
    private sealed record BalanceData(decimal? Available, decimal? Current, string? IsoCurrencyCode, string? UnofficialCurrencyCode);
    private sealed record ItemData(string? InstitutionId, string? InstitutionName);
    private sealed record TransactionsSyncResponse(IReadOnlyCollection<TransactionData> Added,
        IReadOnlyCollection<TransactionData> Modified, IReadOnlyCollection<RemovedData> Removed, string NextCursor, bool HasMore);
    private sealed record TransactionData(string TransactionId, string AccountId, string? PendingTransactionId,
        DateOnly Date, DateOnly? AuthorizedDate, string Name, string? MerchantName, decimal Amount,
        string? IsoCurrencyCode, string? UnofficialCurrencyCode, bool Pending, PersonalFinanceCategoryData? PersonalFinanceCategory);
    private sealed record PersonalFinanceCategoryData(string? Primary, string? Detailed, string? ConfidenceLevel);
    private sealed record RemovedData(string TransactionId);
    private sealed record PlaidErrorResponse(string? ErrorType, string? ErrorCode, string? ErrorMessage, string? RequestId);
}
