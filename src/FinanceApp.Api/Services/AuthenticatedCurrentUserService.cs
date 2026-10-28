using System.Security.Claims;
using FinanceApp.Api.Data;
using FinanceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Services;

public sealed class AuthenticatedCurrentUserService(IHttpContextAccessor httpContextAccessor, FinanceDbContext dbContext)
    : ICurrentUserService
{
    public async Task<User> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        var identifier = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(identifier, out var userId))
            throw new ForbiddenOperationException("An authenticated admin session is required.");
        return await dbContext.Users.SingleAsync(x => x.Id == userId && x.IsAdmin, cancellationToken);
    }
}
