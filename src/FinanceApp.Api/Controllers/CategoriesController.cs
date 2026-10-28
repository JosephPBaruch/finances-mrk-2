using FinanceApp.Api.Data;
using FinanceApp.Api.DTOs;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Produces("application/json")]
public sealed class CategoriesController(FinanceDbContext dbContext, ICurrentUserService currentUserService) : ControllerBase
{
    private static readonly HashSet<string> BudgetBuckets =
    [
        "Fixed Necessities", "Variable Necessities", "Savings & Investing",
        "Lifestyle & Fun", "Irregular & Sinking Funds"
    ];

    /// <summary>Lists assignable user categories.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyCollection<CategoryResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<CategoryResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var categories = await dbContext.Categories.AsNoTracking().Where(x => x.UserId == user.Id)
            .OrderBy(x => x.Name)
            .Select(x => new CategoryResponse(x.Id, x.Name, x.Description, x.BudgetBucket))
            .ToArrayAsync(cancellationToken);
        return Ok(categories);
    }

    /// <summary>Updates how a transaction category feeds the five-bucket budget.</summary>
    [HttpPatch("{categoryId:guid}")]
    [ProducesResponseType<CategoryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryResponse>> Update(
        Guid categoryId, UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        if (request.BudgetBucket is not null && !BudgetBuckets.Contains(request.BudgetBucket))
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            { ["budgetBucket"] = ["budgetBucket must be a supported budget bucket or null."] }));

        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var category = await dbContext.Categories.SingleOrDefaultAsync(
            x => x.Id == categoryId && x.UserId == user.Id, cancellationToken)
            ?? throw new ResourceNotFoundException("Category was not found.");
        category.BudgetBucket = request.BudgetBucket;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new CategoryResponse(category.Id, category.Name, category.Description, category.BudgetBucket));
    }
}
