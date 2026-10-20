using FinanceApp.Api.DTOs;

namespace FinanceApp.Api.Services;

public interface ITransactionSyncService
{
    Task<SyncResponse> SyncAsync(Guid userId, Guid connectionId, CancellationToken cancellationToken = default);
}
