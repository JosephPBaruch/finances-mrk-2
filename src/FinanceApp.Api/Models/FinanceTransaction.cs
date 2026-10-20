namespace FinanceApp.Api.Models;

public sealed class FinanceTransaction
{
    public Guid Id { get; set; }
    public Guid FinancialAccountId { get; set; }
    public required string PlaidTransactionId { get; set; }
    public string? PlaidPendingTransactionId { get; set; }
    public DateOnly Date { get; set; }
    public DateOnly? AuthorizedDate { get; set; }
    public required string Name { get; set; }
    public string? MerchantName { get; set; }
    public decimal Amount { get; set; }
    public string? CurrencyCode { get; set; }
    public bool Pending { get; set; }
    public string? PlaidPrimaryCategory { get; set; }
    public string? PlaidDetailedCategory { get; set; }
    public string? PlaidCategoryConfidence { get; set; }
    public Guid? UserCategoryId { get; set; }
    public bool IsReviewed { get; set; }
    public string? Notes { get; set; }
    public bool IsRemoved { get; set; }
    public DateTimeOffset? RemovedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public FinancialAccount FinancialAccount { get; set; } = null!;
    public Category? UserCategory { get; set; }
}
