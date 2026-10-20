using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Tests;

public sealed class TransactionSyncServiceTests
{
    [Fact]
    public async Task InitialSync_PagesAddedTransactions_AndPersistsFinalCursor()
    {
        await using var database = await TestDatabase.CreateAsync();
        var seeded = await database.SeedConnectionAsync();
        var plaid = new FakePlaidService();
        plaid.SyncResults.Enqueue(new PlaidSyncPage([TestFactories.Transaction("tx-1")], [], [], "cursor-1", true));
        plaid.SyncResults.Enqueue(new PlaidSyncPage([TestFactories.Transaction("tx-2")], [], [], "cursor-2", false));

        var result = await TestFactories.Synchronizer(database.Context, plaid).SyncAsync(seeded.User.Id, seeded.Connection.Id);
        database.Context.ChangeTracker.Clear();

        Assert.Equal(2, result.Added);
        Assert.Equal([null, "cursor-1"], plaid.RequestedCursors);
        Assert.Equal(2, await database.Context.Transactions.CountAsync());
        Assert.Equal("cursor-2", (await database.Context.BankConnections.FindAsync(seeded.Connection.Id))!.TransactionsCursor);
    }

    [Fact]
    public async Task IncrementalSync_ModifiesPlaidFields_ButPreservesUserMetadata()
    {
        await using var database = await TestDatabase.CreateAsync();
        var seeded = await database.SeedConnectionAsync("old-cursor");
        var category = new Category
        {
            Id = Guid.NewGuid(), UserId = seeded.User.Id, Name = "My category", CreatedAt = DateTimeOffset.UtcNow
        };
        var existing = StoredTransaction(seeded.Account.Id, "tx-1");
        existing.UserCategoryId = category.Id;
        existing.IsReviewed = true;
        existing.Notes = "keep this";
        database.Context.AddRange(category, existing);
        await database.Context.SaveChangesAsync();
        var plaid = new FakePlaidService();
        plaid.SyncResults.Enqueue(new PlaidSyncPage([], [TestFactories.Transaction("tx-1", amount: 99m, name: "Updated")], [], "new-cursor", false));

        var result = await TestFactories.Synchronizer(database.Context, plaid).SyncAsync(seeded.User.Id, seeded.Connection.Id);
        database.Context.ChangeTracker.Clear();

        var updated = await database.Context.Transactions.SingleAsync();
        Assert.Equal(1, result.Modified);
        Assert.Equal(99m, updated.Amount);
        Assert.Equal("Updated", updated.Name);
        Assert.Equal(category.Id, updated.UserCategoryId);
        Assert.True(updated.IsReviewed);
        Assert.Equal("keep this", updated.Notes);
    }

    [Fact]
    public async Task RemovedTransaction_IsArchivedWithMetadataIntact()
    {
        await using var database = await TestDatabase.CreateAsync();
        var seeded = await database.SeedConnectionAsync("cursor-1");
        var existing = StoredTransaction(seeded.Account.Id, "tx-remove");
        existing.Notes = "do not lose";
        database.Context.Transactions.Add(existing);
        await database.Context.SaveChangesAsync();
        var plaid = new FakePlaidService();
        plaid.SyncResults.Enqueue(new PlaidSyncPage([], [], ["tx-remove"], "cursor-2", false));

        var result = await TestFactories.Synchronizer(database.Context, plaid).SyncAsync(seeded.User.Id, seeded.Connection.Id);
        database.Context.ChangeTracker.Clear();

        var archived = await database.Context.Transactions.SingleAsync();
        Assert.Equal(1, result.Removed);
        Assert.True(archived.IsRemoved);
        Assert.NotNull(archived.RemovedAt);
        Assert.Equal("do not lose", archived.Notes);
    }

    [Fact]
    public async Task PostedReplacement_CopiesPendingUserMetadata_AndArchivesPending()
    {
        await using var database = await TestDatabase.CreateAsync();
        var seeded = await database.SeedConnectionAsync();
        var pending = StoredTransaction(seeded.Account.Id, "pending-1");
        pending.Pending = true;
        pending.IsReviewed = true;
        pending.Notes = "receipt attached";
        database.Context.Transactions.Add(pending);
        await database.Context.SaveChangesAsync();
        var plaid = new FakePlaidService();
        plaid.SyncResults.Enqueue(new PlaidSyncPage(
            [TestFactories.Transaction("posted-1", pendingId: "pending-1")], [], ["pending-1"], "cursor-1", false));

        await TestFactories.Synchronizer(database.Context, plaid).SyncAsync(seeded.User.Id, seeded.Connection.Id);
        database.Context.ChangeTracker.Clear();

        var oldTransaction = await database.Context.Transactions.SingleAsync(x => x.PlaidTransactionId == "pending-1");
        var posted = await database.Context.Transactions.SingleAsync(x => x.PlaidTransactionId == "posted-1");
        Assert.True(oldTransaction.IsRemoved);
        Assert.True(posted.IsReviewed);
        Assert.Equal("receipt attached", posted.Notes);
        Assert.False(posted.IsRemoved);
    }

    [Fact]
    public async Task DuplicateAddedEvent_DoesNotCreateDuplicateTransaction()
    {
        await using var database = await TestDatabase.CreateAsync();
        var seeded = await database.SeedConnectionAsync();
        database.Context.Transactions.Add(StoredTransaction(seeded.Account.Id, "tx-existing"));
        await database.Context.SaveChangesAsync();
        var plaid = new FakePlaidService();
        plaid.SyncResults.Enqueue(new PlaidSyncPage([TestFactories.Transaction("tx-existing", amount: 42m)], [], [], "cursor-1", false));

        await TestFactories.Synchronizer(database.Context, plaid).SyncAsync(seeded.User.Id, seeded.Connection.Id);
        database.Context.ChangeTracker.Clear();

        Assert.Equal(1, await database.Context.Transactions.CountAsync());
        Assert.Equal(42m, (await database.Context.Transactions.SingleAsync()).Amount);
    }

    [Fact]
    public async Task FailedSync_RollsBackTransactionsAndCursor()
    {
        await using var database = await TestDatabase.CreateAsync();
        var seeded = await database.SeedConnectionAsync("original-cursor");
        var plaid = new FakePlaidService();
        plaid.SyncResults.Enqueue(new PlaidSyncPage(
            [TestFactories.Transaction("tx-good"), TestFactories.Transaction("tx-bad", accountId: "missing-account")],
            [], [], "advanced-cursor", false));

        await Assert.ThrowsAsync<SyncFailedException>(() =>
            TestFactories.Synchronizer(database.Context, plaid).SyncAsync(seeded.User.Id, seeded.Connection.Id));

        Assert.Empty(await database.Context.Transactions.AsNoTracking().ToArrayAsync());
        Assert.Equal("original-cursor", (await database.Context.BankConnections.AsNoTracking()
            .SingleAsync(x => x.Id == seeded.Connection.Id)).TransactionsCursor);
    }

    [Fact]
    public async Task PaginationMutation_RestartsFromOriginalCursor()
    {
        await using var database = await TestDatabase.CreateAsync();
        var seeded = await database.SeedConnectionAsync("original");
        var plaid = new FakePlaidService();
        plaid.SyncResults.Enqueue(new PlaidSyncPage([], [], [], "page-2", true));
        plaid.SyncResults.Enqueue(new PlaidApiException("TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION", "TRANSACTIONS_ERROR", "changed"));
        plaid.SyncResults.Enqueue(new PlaidSyncPage([TestFactories.Transaction("tx-restarted")], [], [], "final", false));

        await TestFactories.Synchronizer(database.Context, plaid).SyncAsync(seeded.User.Id, seeded.Connection.Id);

        Assert.Equal(["original", "page-2", "original"], plaid.RequestedCursors);
        Assert.Equal(1, await database.Context.Transactions.CountAsync());
    }

    private static FinanceTransaction StoredTransaction(Guid accountId, string plaidId) => new()
    {
        Id = Guid.NewGuid(),
        FinancialAccountId = accountId,
        PlaidTransactionId = plaidId,
        Date = new DateOnly(2026, 9, 1),
        Name = "Original",
        Amount = 10m,
        CurrencyCode = "USD",
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow
    };
}
