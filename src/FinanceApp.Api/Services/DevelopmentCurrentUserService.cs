using FinanceApp.Api.Data;
using FinanceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Services;

public sealed class DevelopmentCurrentUserService(FinanceDbContext dbContext) : ICurrentUserService
{
    public async Task<User> GetCurrentUserAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Users.SingleAsync(x => x.Email == DevelopmentUserDefaults.Email, cancellationToken);
}
