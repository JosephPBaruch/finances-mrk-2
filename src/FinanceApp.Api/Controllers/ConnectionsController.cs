using FinanceApp.Api.Data;
using FinanceApp.Api.DTOs;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/connections")]
[Produces("application/json")]
public sealed class ConnectionsController(
    FinanceDbContext dbContext,
    ICurrentUserService currentUserService,
    IBankConnectionService connectionService,
    ITransactionSyncService transactionSyncService,
    ILogger<ConnectionsController> logger) : ControllerBase
{
    /// <summary>Lists the current user's bank connections and accounts. Access tokens are never returned.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyCollection<ConnectionResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<ConnectionResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var connections = await dbContext.BankConnections.AsNoTracking().Include(x => x.Accounts)
            .Where(x => x.UserId == user.Id).ToArrayAsync(cancellationToken);

        // SQLite cannot translate ORDER BY for DateTimeOffset values. A user has a small number
        // of bank connections, so preserve creation-time ordering after materializing the rows.
        return Ok(connections.OrderBy(x => x.CreatedAt).Select(x => x.ToResponse()).ToArray());
    }

    /// <summary>Gets one bank connection and its accounts.</summary>
    /// <param name="bankConnectionId">The application's bankConnectionId returned by POST /api/plaid/sandbox/connect, POST /api/plaid/exchange-token, or GET /api/connections. This is not a Plaid institution ID or an account ID.</param>
    /// <param name="cancellationToken">Canceled when the client disconnects.</param>
    [HttpGet("{bankConnectionId:guid}")]
    [ProducesResponseType<ConnectionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConnectionResponse>> GetById(Guid bankConnectionId, CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var connection = await dbContext.BankConnections.AsNoTracking().Include(x => x.Accounts)
            .SingleOrDefaultAsync(x => x.Id == bankConnectionId && x.UserId == user.Id, cancellationToken)
            ?? throw new ResourceNotFoundException("Bank connection was not found.");
        return Ok(connection.ToResponse());
    }

    /// <summary>Refreshes account metadata and balances using Plaid /accounts/get.</summary>
    /// <param name="bankConnectionId">The application's bankConnectionId returned by a connection-creation endpoint or GET /api/connections.</param>
    /// <param name="cancellationToken">Canceled when the client disconnects.</param>
    [HttpPost("{bankConnectionId:guid}/refresh-accounts")]
    [ProducesResponseType<AccountRefreshResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccountRefreshResponse>> RefreshAccounts(Guid bankConnectionId, CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        return Ok(await connectionService.RefreshAccountsAsync(user.Id, bankConnectionId, cancellationToken));
    }

    /// <summary>Runs cursor-based Plaid transaction synchronization for one connection.</summary>
    /// <param name="bankConnectionId">The application's bankConnectionId returned by a connection-creation endpoint or GET /api/connections. Do not use institutionId, accountId, or PlaidItemId.</param>
    /// <param name="cancellationToken">Canceled when the client disconnects.</param>
    [HttpPost("{bankConnectionId:guid}/sync")]
    [ProducesResponseType<SyncResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SyncResponse>> Sync(Guid bankConnectionId, CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        return Ok(await transactionSyncService.SyncAsync(user.Id, bankConnectionId, cancellationToken));
    }

    /// <summary>Synchronizes every connection for the current user and reports each result independently.</summary>
    [HttpPost("sync-all")]
    [ProducesResponseType<SyncAllResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<SyncAllResponse>> SyncAll(CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var ids = await dbContext.BankConnections.AsNoTracking().Where(x => x.UserId == user.Id)
            .Select(x => x.Id).ToArrayAsync(cancellationToken);
        var results = new List<SyncAllItemResponse>(ids.Length);
        foreach (var id in ids)
        {
            try
            {
                var statistics = await transactionSyncService.SyncAsync(user.Id, id, cancellationToken);
                results.Add(new SyncAllItemResponse(id, true, statistics, null));
            }
            catch (Exception exception) when (exception is PlaidApiException or SyncFailedException)
            {
                logger.LogWarning(exception, "Sync-all failed for connection {ConnectionId}", id);
                results.Add(new SyncAllItemResponse(id, false, null, "Synchronization failed for this connection."));
            }
        }
        return Ok(new SyncAllResponse(results));
    }
}
