using FinanceApp.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace FinanceApp.Api.Tests;

public sealed class BankConnectionServiceTests
{
    [Fact]
    public async Task Exchange_PersistsConnectionAccountsAndEncryptedToken()
    {
        await using var database = await TestDatabase.CreateAsync();
        var user = await database.Context.Users.SingleAsync();
        var plaid = new FakePlaidService
        {
            ExchangeResult = new("raw-access-token", "item-new"),
            AccountsResult = new("ins_109508", "First Platypus Bank",
                [new PlaidAccount("account-1", "Checking", "Primary Checking", "depository", "checking", "1234", 500m, 450m, "USD")])
        };
        plaid.SyncResults.Enqueue(new PlaidSyncPage([], [], [], "initial-cursor", false));
        var sync = TestFactories.Synchronizer(database.Context, plaid);
        var service = new BankConnectionService(database.Context, plaid, TestDatabase.Encryption, sync,
            NullLogger<BankConnectionService>.Instance);

        var response = await service.ExchangeAndCreateAsync(user.Id, "public-token");
        database.Context.ChangeTracker.Clear();

        var stored = await database.Context.BankConnections.Include(x => x.Accounts).SingleAsync(x => x.Id == response.BankConnectionId);
        Assert.NotEqual("raw-access-token", stored.AccessToken);
        Assert.Equal("raw-access-token", TestDatabase.Encryption.Decrypt(stored.AccessToken));
        Assert.Equal("First Platypus Bank", stored.InstitutionName);
        Assert.Single(stored.Accounts);
        Assert.Equal(500m, stored.Accounts.Single().CurrentBalance);
        Assert.Equal("initial-cursor", stored.TransactionsCursor);
    }

    [Fact]
    public async Task Exchange_RejectsDuplicateItem()
    {
        await using var database = await TestDatabase.CreateAsync();
        var seeded = await database.SeedConnectionAsync();
        var plaid = new FakePlaidService { ExchangeResult = new("another-token", seeded.Connection.PlaidItemId) };
        var service = new BankConnectionService(database.Context, plaid, TestDatabase.Encryption,
            TestFactories.Synchronizer(database.Context, plaid), NullLogger<BankConnectionService>.Instance);

        await Assert.ThrowsAsync<DuplicateConnectionException>(() =>
            service.ExchangeAndCreateAsync(seeded.User.Id, "public-token"));
    }
}
