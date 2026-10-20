namespace FinanceApp.Api.Models;

public sealed class FinancialAccount
{
    public Guid Id { get; set; }
    public Guid BankConnectionId { get; set; }
    public required string PlaidAccountId { get; set; }
    public required string Name { get; set; }
    public string? OfficialName { get; set; }
    public required string Type { get; set; }
    public string? Subtype { get; set; }
    public string? Mask { get; set; }
    public decimal? CurrentBalance { get; set; }
    public decimal? AvailableBalance { get; set; }
    public string? CurrencyCode { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public BankConnection BankConnection { get; set; } = null!;
    public ICollection<FinanceTransaction> Transactions { get; set; } = [];
}
