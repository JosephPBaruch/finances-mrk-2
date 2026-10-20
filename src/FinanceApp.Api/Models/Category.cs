namespace FinanceApp.Api.Models;

public sealed class Category
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public User User { get; set; } = null!;
    public ICollection<FinanceTransaction> Transactions { get; set; } = [];
}
