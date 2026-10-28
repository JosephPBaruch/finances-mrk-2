namespace FinanceApp.Api.Services;

public interface IPlaidService
{
    Task<PlaidLinkTokenResult> CreateLinkTokenAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<PlaidExchangeResult> ExchangePublicTokenAsync(string publicToken, CancellationToken cancellationToken = default);
    Task<string> CreateSandboxPublicTokenAsync(string institutionId, CancellationToken cancellationToken = default);
    Task<PlaidAccountsResult> GetAccountsAsync(string accessToken, CancellationToken cancellationToken = default);
    Task<PlaidSyncPage> SyncTransactionsAsync(string accessToken, string? cursor, CancellationToken cancellationToken = default);
    Task RemoveItemAsync(string accessToken, CancellationToken cancellationToken = default);
}

public sealed record PlaidLinkTokenResult(string LinkToken, DateTimeOffset Expiration);
public sealed record PlaidExchangeResult(string AccessToken, string ItemId);
public sealed record PlaidAccountsResult(string? InstitutionId, string? InstitutionName, IReadOnlyCollection<PlaidAccount> Accounts);
public sealed record PlaidAccount(string AccountId, string Name, string? OfficialName, string Type, string? Subtype,
    string? Mask, decimal? CurrentBalance, decimal? AvailableBalance, string? CurrencyCode);
public sealed record PlaidSyncPage(IReadOnlyCollection<PlaidTransaction> Added, IReadOnlyCollection<PlaidTransaction> Modified,
    IReadOnlyCollection<string> RemovedTransactionIds, string NextCursor, bool HasMore);
public sealed record PlaidTransaction(string TransactionId, string AccountId, string? PendingTransactionId,
    DateOnly Date, DateOnly? AuthorizedDate, string Name, string? MerchantName, decimal Amount, string? CurrencyCode,
    bool Pending, string? PrimaryCategory, string? DetailedCategory, string? CategoryConfidence);
