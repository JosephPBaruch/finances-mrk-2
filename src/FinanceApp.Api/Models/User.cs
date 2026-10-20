namespace FinanceApp.Api.Models;

public sealed class User
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string DisplayName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<BankConnection> BankConnections { get; set; } = [];
    public ICollection<Category> Categories { get; set; } = [];
}
