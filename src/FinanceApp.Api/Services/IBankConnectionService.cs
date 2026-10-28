using FinanceApp.Api.DTOs;

namespace FinanceApp.Api.Services;

public interface IBankConnectionService
{
    Task<ConnectionCreatedResponse> ExchangeAndCreateAsync(Guid userId, string publicToken, CancellationToken cancellationToken = default);
    Task<AccountRefreshResponse> RefreshAccountsAsync(Guid userId, Guid connectionId, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid userId, Guid connectionId, CancellationToken cancellationToken = default);
}
