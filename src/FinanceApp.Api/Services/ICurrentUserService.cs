using FinanceApp.Api.Models;

namespace FinanceApp.Api.Services;

public interface ICurrentUserService
{
    Task<User> GetCurrentUserAsync(CancellationToken cancellationToken = default);
}
