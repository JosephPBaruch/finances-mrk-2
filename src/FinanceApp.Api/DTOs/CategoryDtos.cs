namespace FinanceApp.Api.DTOs;

public sealed record CategoryResponse(Guid CategoryId, string Name, string? Description);
