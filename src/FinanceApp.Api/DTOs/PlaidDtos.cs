using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.DTOs;

public sealed record LinkTokenResponse(string LinkToken, DateTimeOffset Expiration);

public sealed class ExchangeTokenRequest
{
    [Required]
    public string PublicToken { get; init; } = string.Empty;
}

public sealed class SandboxConnectRequest
{
    [Required]
    public string InstitutionId { get; init; } = "ins_109508";
}

public sealed record ConnectionCreatedResponse(Guid BankConnectionId, string? InstitutionName, int AccountCount);
