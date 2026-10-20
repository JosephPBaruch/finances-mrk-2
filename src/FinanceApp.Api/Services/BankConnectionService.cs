using FinanceApp.Api.Data;
using FinanceApp.Api.DTOs;
using FinanceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Services;

public sealed class BankConnectionService(
    FinanceDbContext dbContext,
    IPlaidService plaidService,
    IEncryptionService encryptionService,
    ITransactionSyncService transactionSyncService,
    ILogger<BankConnectionService> logger) : IBankConnectionService
{
    public async Task<ConnectionCreatedResponse> ExchangeAndCreateAsync(
        Guid userId, string publicToken, CancellationToken cancellationToken = default)
    {
        var exchange = await plaidService.ExchangePublicTokenAsync(publicToken, cancellationToken);
        if (await dbContext.BankConnections.AnyAsync(
                x => x.UserId == userId && x.PlaidItemId == exchange.ItemId, cancellationToken))
            throw new DuplicateConnectionException("This Plaid Item is already connected.");

        var accounts = await plaidService.GetAccountsAsync(exchange.AccessToken, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var connection = new BankConnection
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PlaidItemId = exchange.ItemId,
            InstitutionId = accounts.InstitutionId,
            InstitutionName = accounts.InstitutionName,
            AccessToken = encryptionService.Encrypt(exchange.AccessToken),
            Status = BankConnectionStatus.Active,
            CreatedAt = now,
            UpdatedAt = now,
            Accounts = accounts.Accounts.Select(x => MapAccount(x, now)).ToList()
        };

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        dbContext.BankConnections.Add(connection);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException?.Message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) == true)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new DuplicateConnectionException("This bank connection or one of its accounts already exists.");
        }

        try
        {
            await transactionSyncService.SyncAsync(userId, connection.Id, cancellationToken);
        }
        catch (Exception exception) when (exception is PlaidApiException or SyncFailedException)
        {
            // Plaid can take time to prepare initial Transactions data. The connection and accounts
            // remain usable, and a later manual sync will resume from the unchanged cursor.
            logger.LogWarning(exception, "Initial transaction sync is not yet available for connection {ConnectionId}", connection.Id);
        }

        return new ConnectionCreatedResponse(connection.Id, connection.InstitutionName, connection.Accounts.Count);
    }

    public async Task<AccountRefreshResponse> RefreshAccountsAsync(
        Guid userId, Guid connectionId, CancellationToken cancellationToken = default)
    {
        var connection = await dbContext.BankConnections.Include(x => x.Accounts)
            .SingleOrDefaultAsync(x => x.Id == connectionId && x.UserId == userId, cancellationToken)
            ?? throw new ResourceNotFoundException("Bank connection was not found.");
        var result = await plaidService.GetAccountsAsync(encryptionService.Decrypt(connection.AccessToken), cancellationToken);
        var now = DateTimeOffset.UtcNow;
        connection.InstitutionId = result.InstitutionId ?? connection.InstitutionId;
        connection.InstitutionName = result.InstitutionName ?? connection.InstitutionName;
        connection.UpdatedAt = now;

        foreach (var plaidAccount in result.Accounts)
        {
            var account = connection.Accounts.SingleOrDefault(x => x.PlaidAccountId == plaidAccount.AccountId);
            if (account is null)
            {
                connection.Accounts.Add(MapAccount(plaidAccount, now));
                continue;
            }
            UpdateAccount(account, plaidAccount, now);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return new AccountRefreshResponse(connection.Id, connection.Accounts.Count, now);
    }

    private static FinancialAccount MapAccount(PlaidAccount account, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        PlaidAccountId = account.AccountId,
        Name = account.Name,
        OfficialName = account.OfficialName,
        Type = account.Type,
        Subtype = account.Subtype,
        Mask = account.Mask,
        CurrentBalance = account.CurrentBalance,
        AvailableBalance = account.AvailableBalance,
        CurrencyCode = account.CurrencyCode,
        CreatedAt = now,
        UpdatedAt = now
    };

    private static void UpdateAccount(FinancialAccount target, PlaidAccount source, DateTimeOffset now)
    {
        target.Name = source.Name;
        target.OfficialName = source.OfficialName;
        target.Type = source.Type;
        target.Subtype = source.Subtype;
        target.Mask = source.Mask;
        target.CurrentBalance = source.CurrentBalance;
        target.AvailableBalance = source.AvailableBalance;
        target.CurrencyCode = source.CurrencyCode;
        target.UpdatedAt = now;
    }
}
