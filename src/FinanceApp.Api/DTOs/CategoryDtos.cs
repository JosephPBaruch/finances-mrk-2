using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.DTOs;

public sealed record CategoryResponse(Guid CategoryId, string Name, string? Description, string? BudgetBucket);

public sealed class UpdateCategoryRequest
{
    [StringLength(100)]
    public string? BudgetBucket { get; init; }
}
