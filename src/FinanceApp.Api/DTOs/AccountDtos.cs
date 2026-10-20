namespace FinanceApp.Api.DTOs;

public sealed record AccountResponse(
    Guid Id,
    Guid BankConnectionId,
    string Name,
    string? OfficialName,
    string Type,
    string? Subtype,
    string? Mask,
    decimal? CurrentBalance,
    decimal? AvailableBalance,
    string? CurrencyCode,
    DateTimeOffset UpdatedAt);

public sealed record ConnectionResponse(
    Guid Id,
    string? InstitutionId,
    string? InstitutionName,
    string Status,
    DateTimeOffset? LastSuccessfulSyncAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyCollection<AccountResponse> Accounts);

public sealed record AccountRefreshResponse(Guid BankConnectionId, int AccountCount, DateTimeOffset RefreshedAt);
