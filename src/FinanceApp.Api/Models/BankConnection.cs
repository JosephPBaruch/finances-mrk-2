namespace FinanceApp.Api.Models;

public enum BankConnectionStatus
{
    Active,
    Error,
    RequiresUpdate
}

public sealed class BankConnection
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string PlaidItemId { get; set; }
    public string? InstitutionId { get; set; }
    public string? InstitutionName { get; set; }
    public required string AccessToken { get; set; }
    public string? TransactionsCursor { get; set; }
    public BankConnectionStatus Status { get; set; } = BankConnectionStatus.Active;
    public DateTimeOffset? LastSuccessfulSyncAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public User User { get; set; } = null!;
    public ICollection<FinancialAccount> Accounts { get; set; } = [];
}
