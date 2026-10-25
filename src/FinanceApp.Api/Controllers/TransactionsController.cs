using FinanceApp.Api.Data;
using FinanceApp.Api.DTOs;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/transactions")]
[Produces("application/json")]
public sealed class TransactionsController(FinanceDbContext dbContext, ICurrentUserService currentUserService) : ControllerBase
{
    /// <summary>Queries active transactions with filtering and pagination.</summary>
    [HttpGet]
    [ProducesResponseType<PagedResponse<TransactionResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<TransactionResponse>>> GetAll(
        [FromQuery] Guid? accountId,
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        [FromQuery] Guid? categoryId,
        [FromQuery] bool? isReviewed,
        [FromQuery] bool? pending,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 200)
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["pagination"] = ["page must be at least 1 and pageSize must be between 1 and 200."]
            }));
        if (startDate.HasValue && endDate.HasValue && startDate > endDate)
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            { ["dateRange"] = ["startDate cannot be after endDate."] }));

        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var query = dbContext.Transactions.AsNoTracking()
            .Where(x => x.FinancialAccount.BankConnection.UserId == user.Id && !x.IsRemoved);
        if (accountId.HasValue) query = query.Where(x => x.FinancialAccountId == accountId);
        if (startDate.HasValue) query = query.Where(x => x.Date >= startDate);
        if (endDate.HasValue) query = query.Where(x => x.Date <= endDate);
        if (categoryId.HasValue) query = query.Where(x => x.UserCategoryId == categoryId);
        if (isReviewed.HasValue) query = query.Where(x => x.IsReviewed == isReviewed);
        if (pending.HasValue) query = query.Where(x => x.Pending == pending);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.Date).ThenByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => x.ToResponse()).ToArrayAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new PagedResponse<TransactionResponse>(items, page, pageSize, totalCount, totalPages));
    }

    /// <summary>Gets one active transaction owned by the current user.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType<TransactionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TransactionResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var transaction = await dbContext.Transactions.AsNoTracking().SingleOrDefaultAsync(
            x => x.Id == id && !x.IsRemoved && x.FinancialAccount.BankConnection.UserId == user.Id, cancellationToken)
            ?? throw new ResourceNotFoundException("Transaction was not found.");
        return Ok(transaction.ToResponse());
    }

    /// <summary>Updates only user-owned category, review, and notes metadata.</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType<TransactionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TransactionResponse>> Update(
        Guid id, UpdateTransactionRequest request, CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var transaction = await dbContext.Transactions.SingleOrDefaultAsync(
            x => x.Id == id && !x.IsRemoved && x.FinancialAccount.BankConnection.UserId == user.Id, cancellationToken)
            ?? throw new ResourceNotFoundException("Transaction was not found.");

        if (request.UserCategoryIdSpecified && request.UserCategoryId.HasValue &&
            !await dbContext.Categories.AnyAsync(
                x => x.Id == request.UserCategoryId && x.UserId == user.Id, cancellationToken))
            throw new ResourceNotFoundException("Category was not found.");

        if (request.UserCategoryIdSpecified) transaction.UserCategoryId = request.UserCategoryId;
        if (request.IsReviewedSpecified)
        {
            if (!request.IsReviewed.HasValue)
                return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
                { ["isReviewed"] = ["isReviewed cannot be null."] }));
            transaction.IsReviewed = request.IsReviewed.Value;
        }
        if (request.NotesSpecified) transaction.Notes = request.Notes;
        transaction.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(transaction.ToResponse());
    }
}
