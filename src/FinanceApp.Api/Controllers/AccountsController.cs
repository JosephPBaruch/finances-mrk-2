using FinanceApp.Api.Data;
using FinanceApp.Api.DTOs;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/accounts")]
[Produces("application/json")]
public sealed class AccountsController(FinanceDbContext dbContext, ICurrentUserService currentUserService) : ControllerBase
{
    /// <summary>Lists every active financial account belonging to the current development user.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyCollection<AccountResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<AccountResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var accounts = await dbContext.FinancialAccounts.AsNoTracking()
            .Where(x => x.BankConnection.UserId == user.Id)
            .OrderBy(x => x.Name)
            .Select(x => x.ToResponse())
            .ToArrayAsync(cancellationToken);
        return Ok(accounts);
    }

    /// <summary>Gets one financial account owned by the current development user.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType<AccountResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccountResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var account = await dbContext.FinancialAccounts.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id && x.BankConnection.UserId == user.Id, cancellationToken)
            ?? throw new ResourceNotFoundException("Financial account was not found.");
        return Ok(account.ToResponse());
    }
}
