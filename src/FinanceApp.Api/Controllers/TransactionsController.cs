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
    /// <summary>Queries transactions previously synchronized from Plaid into this application's database.</summary>
    /// <param name="accountId">Optional application accountId returned by GET /api/accounts. This is not a bankConnectionId or PlaidAccountId.</param>
    /// <param name="startDate">Optional inclusive start date in YYYY-MM-DD format.</param>
    /// <param name="endDate">Optional inclusive end date in YYYY-MM-DD format. It cannot be earlier than startDate.</param>
    /// <param name="categoryId">Optional application-defined user category ID.</param>
    /// <param name="isReviewed">Optional review-status filter: true or false.</param>
    /// <param name="pending">Optional Plaid pending-status filter: true or false.</param>
    /// <param name="page">One-based page number. Minimum: 1.</param>
    /// <param name="pageSize">Number of transactions per page. Range: 1–200.</param>
    /// <param name="cancellationToken">Canceled when the client disconnects.</param>
    [HttpGet]
    [ProducesResponseType<PagedResponse<TransactionResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
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
        var query = dbContext.Transactions.AsNoTracking().Include(x => x.UserCategory)
            .Where(x => x.FinancialAccount.BankConnection.UserId == user.Id && !x.IsRemoved);
        if (accountId.HasValue) query = query.Where(x => x.FinancialAccountId == accountId);
        if (startDate.HasValue) query = query.Where(x => x.Date >= startDate);
        if (endDate.HasValue) query = query.Where(x => x.Date <= endDate);
        if (categoryId.HasValue) query = query.Where(x => x.UserCategoryId == categoryId);
        if (isReviewed.HasValue) query = query.Where(x => x.IsReviewed == isReviewed);
        if (pending.HasValue) query = query.Where(x => x.Pending == pending);

        var totalCount = await query.CountAsync(cancellationToken);
        // SQLite cannot translate ORDER BY for DateTimeOffset values. Use the primary key as a
        // deterministic tie-breaker so pagination remains stable without materializing every row.
        var items = await query.OrderByDescending(x => x.Date).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => x.ToResponse()).ToArrayAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return Ok(new PagedResponse<TransactionResponse>(items, page, pageSize, totalCount, totalPages));
    }

    /// <summary>Gets one active transaction owned by the current user.</summary>
    /// <param name="transactionId">The application's transactionId returned by GET /api/transactions. This is not PlaidTransactionId.</param>
    /// <param name="cancellationToken">Canceled when the client disconnects.</param>
    [HttpGet("{transactionId:guid}")]
    [ProducesResponseType<TransactionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TransactionResponse>> GetById(Guid transactionId, CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var transaction = await dbContext.Transactions.AsNoTracking().Include(x => x.UserCategory).SingleOrDefaultAsync(
            x => x.Id == transactionId && !x.IsRemoved && x.FinancialAccount.BankConnection.UserId == user.Id, cancellationToken)
            ?? throw new ResourceNotFoundException("Transaction was not found.");
        return Ok(transaction.ToResponse());
    }

    /// <summary>Updates only user-owned category review, independent resolution status, and notes metadata.</summary>
    /// <param name="transactionId">The application's transactionId returned by GET /api/transactions. This is not PlaidTransactionId.</param>
    /// <param name="request">The user-editable transaction metadata. Plaid-owned transaction fields cannot be changed.</param>
    /// <param name="cancellationToken">Canceled when the client disconnects.</param>
    [HttpPatch("{transactionId:guid}")]
    [ProducesResponseType<TransactionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TransactionResponse>> Update(
        Guid transactionId, UpdateTransactionRequest request, CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var transaction = await dbContext.Transactions.SingleOrDefaultAsync(
            x => x.Id == transactionId && !x.IsRemoved && x.FinancialAccount.BankConnection.UserId == user.Id, cancellationToken)
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
        if (request.IsResolvedSpecified)
        {
            if (!request.IsResolved.HasValue)
                return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
                { ["isResolved"] = ["isResolved cannot be null."] }));
            transaction.IsResolved = request.IsResolved.Value;
        }
        if (request.NotesSpecified) transaction.Notes = request.Notes;
        transaction.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(transaction.ToResponse());
    }
}
