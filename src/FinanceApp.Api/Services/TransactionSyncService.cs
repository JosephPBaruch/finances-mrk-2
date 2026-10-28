using FinanceApp.Api.Data;
using FinanceApp.Api.DTOs;
using FinanceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Services;

public sealed class TransactionSyncService(
    FinanceDbContext dbContext,
    IPlaidService plaidService,
    IEncryptionService encryptionService,
    ILogger<TransactionSyncService> logger) : ITransactionSyncService
{
    private const int MaximumPaginationRestarts = 3;

    public async Task<SyncResponse> SyncAsync(Guid userId, Guid connectionId, CancellationToken cancellationToken = default)
    {
        var connection = await dbContext.BankConnections.Include(x => x.Accounts)
            .ThenInclude(x => x.Transactions)
            .SingleOrDefaultAsync(x => x.Id == connectionId && x.UserId == userId, cancellationToken)
            ?? throw new ResourceNotFoundException("Bank connection was not found.");

        var accessToken = encryptionService.Decrypt(connection.AccessToken);
        var originalCursor = connection.TransactionsCursor;
        List<PlaidSyncPage> pages;
        try
        {
            pages = await FetchAllPagesAsync(accessToken, originalCursor, connectionId, cancellationToken);
        }
        catch (PlaidApiException exception) when (exception.ErrorCode == "ITEM_LOGIN_REQUIRED")
        {
            connection.Status = BankConnectionStatus.RequiresUpdate;
            connection.UpdatedAt = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            throw;
        }

        await using var databaseTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var now = DateTimeOffset.UtcNow;
            var accountsByPlaidId = connection.Accounts.ToDictionary(x => x.PlaidAccountId, StringComparer.Ordinal);
            var allTransactions = connection.Accounts.SelectMany(x => x.Transactions).ToList();
            var byPlaidId = allTransactions.GroupBy(x => x.PlaidTransactionId, StringComparer.Ordinal)
                .ToDictionary(x => x.Key, x => x.First(), StringComparer.Ordinal);

            foreach (var removedId in pages.SelectMany(x => x.RemovedTransactionIds).Distinct(StringComparer.Ordinal))
            {
                if (byPlaidId.TryGetValue(removedId, out var removed))
                {
                    removed.IsRemoved = true;
                    removed.RemovedAt = now;
                    removed.UpdatedAt = now;
                }
            }

            var addedCount = 0;
            foreach (var plaidTransaction in pages.SelectMany(x => x.Added))
            {
                if (!accountsByPlaidId.TryGetValue(plaidTransaction.AccountId, out var account))
                    throw new SyncFailedException($"Plaid returned a transaction for unknown account {plaidTransaction.AccountId}.");

                if (byPlaidId.TryGetValue(plaidTransaction.TransactionId, out var existing))
                {
                    ApplyPlaidFields(existing, plaidTransaction, account.Id, now);
                    continue;
                }

                var created = CreateTransaction(plaidTransaction, account.Id, now);
                if (plaidTransaction.PendingTransactionId is not null &&
                    byPlaidId.TryGetValue(plaidTransaction.PendingTransactionId, out var pending))
                {
                    created.UserCategoryId = pending.UserCategoryId;
                    created.IsReviewed = pending.IsReviewed;
                    created.IsResolved = pending.IsResolved;
                    created.Notes = pending.Notes;
                    pending.IsRemoved = true;
                    pending.RemovedAt = now;
                    pending.UpdatedAt = now;
                }

                dbContext.Transactions.Add(created);
                byPlaidId[created.PlaidTransactionId] = created;
                addedCount++;
            }

            var modifiedCount = 0;
            foreach (var plaidTransaction in pages.SelectMany(x => x.Modified))
            {
                if (!accountsByPlaidId.TryGetValue(plaidTransaction.AccountId, out var account))
                    throw new SyncFailedException($"Plaid returned a transaction for unknown account {plaidTransaction.AccountId}.");

                if (byPlaidId.TryGetValue(plaidTransaction.TransactionId, out var existing))
                {
                    ApplyPlaidFields(existing, plaidTransaction, account.Id, now);
                    modifiedCount++;
                }
                else
                {
                    var created = CreateTransaction(plaidTransaction, account.Id, now);
                    dbContext.Transactions.Add(created);
                    byPlaidId[created.PlaidTransactionId] = created;
                    modifiedCount++;
                }
            }

            connection.TransactionsCursor = pages[^1].NextCursor;
            connection.LastSuccessfulSyncAt = now;
            connection.Status = BankConnectionStatus.Active;
            connection.UpdatedAt = now;
            await dbContext.SaveChangesAsync(cancellationToken);
            await databaseTransaction.CommitAsync(cancellationToken);

            var removedCount = pages.SelectMany(x => x.RemovedTransactionIds).Distinct(StringComparer.Ordinal).Count();
            return new SyncResponse(addedCount, modifiedCount, removedCount, now, false);
        }
        catch (Exception exception)
        {
            await databaseTransaction.RollbackAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();
            logger.LogError(exception, "Transaction synchronization failed for connection {ConnectionId}", connectionId);
            throw exception is SyncFailedException ? exception : new SyncFailedException("Transaction synchronization failed; no changes were saved.", exception);
        }
    }

    private async Task<List<PlaidSyncPage>> FetchAllPagesAsync(
        string accessToken, string? originalCursor, Guid connectionId, CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= MaximumPaginationRestarts; attempt++)
        {
            var cursor = originalCursor;
            var pages = new List<PlaidSyncPage>();
            try
            {
                do
                {
                    var page = await plaidService.SyncTransactionsAsync(accessToken, cursor, cancellationToken);
                    pages.Add(page);
                    cursor = page.NextCursor;
                    if (!page.HasMore) return pages;
                } while (true);
            }
            catch (PlaidApiException exception) when (
                exception.ErrorCode == "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION" && attempt < MaximumPaginationRestarts)
            {
                logger.LogWarning("Restarting Plaid pagination from original cursor for connection {ConnectionId}; attempt {Attempt}",
                    connectionId, attempt + 1);
            }
        }

        throw new SyncFailedException("Plaid transaction data kept changing during pagination. Try again later.");
    }

    private static FinanceTransaction CreateTransaction(PlaidTransaction source, Guid accountId, DateTimeOffset now)
    {
        var target = new FinanceTransaction
        {
            Id = Guid.NewGuid(),
            FinancialAccountId = accountId,
            PlaidTransactionId = source.TransactionId,
            Name = source.Name,
            Date = source.Date,
            Amount = source.Amount,
            CreatedAt = now,
            UpdatedAt = now
        };
        ApplyPlaidFields(target, source, accountId, now);
        return target;
    }

    private static void ApplyPlaidFields(FinanceTransaction target, PlaidTransaction source, Guid accountId, DateTimeOffset now)
    {
        target.FinancialAccountId = accountId;
        target.PlaidPendingTransactionId = source.PendingTransactionId;
        target.Date = source.Date;
        target.AuthorizedDate = source.AuthorizedDate;
        target.Name = source.Name;
        target.MerchantName = source.MerchantName;
        target.Amount = source.Amount;
        target.CurrencyCode = source.CurrencyCode;
        target.Pending = source.Pending;
        target.PlaidPrimaryCategory = source.PrimaryCategory;
        target.PlaidDetailedCategory = source.DetailedCategory;
        target.PlaidCategoryConfidence = source.CategoryConfidence;
        if (target.UserCategoryId is null &&
            source.PrimaryCategory?.ToUpperInvariant() is "INCOME" or "TRANSFER_IN")
            target.UserCategoryId = DefaultCategories.IncomeId;
        target.IsRemoved = false;
        target.RemovedAt = null;
        target.UpdatedAt = now;
    }
}
