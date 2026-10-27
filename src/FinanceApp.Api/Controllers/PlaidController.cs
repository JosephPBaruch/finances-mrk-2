using FinanceApp.Api.Configuration;
using FinanceApp.Api.DTOs;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/plaid")]
[Produces("application/json")]
public sealed class PlaidController(
    IPlaidService plaidService,
    IBankConnectionService connectionService,
    ICurrentUserService currentUserService,
    IOptions<PlaidOptions> plaidOptions,
    IWebHostEnvironment environment) : ControllerBase
{
    /// <summary>Creates a short-lived token for launching Plaid Link.</summary>
    [HttpPost("link-token")]
    [ProducesResponseType<LinkTokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<LinkTokenResponse>> CreateLinkToken(CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var result = await plaidService.CreateLinkTokenAsync(user.Id, cancellationToken);
        return Ok(new LinkTokenResponse(result.LinkToken, result.Expiration));
    }

    /// <summary>Exchanges a Plaid public token and stores its Item and accounts.</summary>
    [HttpPost("exchange-token")]
    [ProducesResponseType<ConnectionCreatedResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<ConnectionCreatedResponse>> ExchangeToken(
        ExchangeTokenRequest request, CancellationToken cancellationToken)
    {
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var result = await connectionService.ExchangeAndCreateAsync(user.Id, request.PublicToken, cancellationToken);
        return CreatedAtAction(nameof(ConnectionsController.GetById), "Connections",
            new { bankConnectionId = result.BankConnectionId }, result);
    }

    /// <summary>Creates and stores a simulated Plaid Item without launching Link. Development/Sandbox only.</summary>
    [HttpPost("sandbox/connect")]
    [ProducesResponseType<ConnectionCreatedResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConnectionCreatedResponse>> ConnectSandbox(
        SandboxConnectRequest request, CancellationToken cancellationToken)
    {
        if (!environment.IsDevelopment() ||
            !plaidOptions.Value.Environment.Equals("sandbox", StringComparison.OrdinalIgnoreCase))
            return NotFound();

        var publicToken = await plaidService.CreateSandboxPublicTokenAsync(request.InstitutionId, cancellationToken);
        var user = await currentUserService.GetCurrentUserAsync(cancellationToken);
        var result = await connectionService.ExchangeAndCreateAsync(user.Id, publicToken, cancellationToken);
        return CreatedAtAction(nameof(ConnectionsController.GetById), "Connections",
            new { bankConnectionId = result.BankConnectionId }, result);
    }
}
