using FinanceApp.Api.Controllers;
using FinanceApp.Api.DTOs;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

namespace FinanceApp.Api.Tests;

public sealed class ControllerQueryTests
{
    [Fact]
    public async Task GetTransactions_ExecutesPagedQueryAgainstSqlite()
    {
        await using var database = await TestDatabase.CreateAsync();
        var seeded = await database.SeedConnectionAsync();
        var now = DateTimeOffset.UtcNow;
        database.Context.Transactions.AddRange(
            Transaction(seeded.Account.Id, "tx-newer", new DateOnly(2026, 10, 2), now),
            Transaction(seeded.Account.Id, "tx-older", new DateOnly(2026, 10, 1), now.AddMinutes(-1)));
        await database.Context.SaveChangesAsync();

        var controller = new TransactionsController(
            database.Context, new DevelopmentCurrentUserService(database.Context));

        var action = await controller.GetAll(null, null, null, null, null, null, 1, 50);

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var response = Assert.IsType<PagedResponse<TransactionResponse>>(ok.Value);
        Assert.Equal(2, response.TotalCount);
        Assert.Equal(["tx-newer", "tx-older"], response.Items.Select(x => x.PlaidTransactionId));
    }

    [Fact]
    public async Task GetConnections_OrdersByCreationTimeAfterSqliteQuery()
    {
        await using var database = await TestDatabase.CreateAsync();
        var first = await database.SeedConnectionAsync();
        var second = await database.SeedConnectionAsync();
        first.Connection.CreatedAt = new DateTimeOffset(2026, 10, 1, 0, 0, 0, TimeSpan.Zero);
        second.Connection.CreatedAt = new DateTimeOffset(2026, 10, 2, 0, 0, 0, TimeSpan.Zero);
        await database.Context.SaveChangesAsync();

        var plaid = new FakePlaidService();
        var sync = TestFactories.Synchronizer(database.Context, plaid);
        var connectionService = new BankConnectionService(
            database.Context, plaid, TestDatabase.Encryption, sync, NullLogger<BankConnectionService>.Instance);
        var controller = new ConnectionsController(
            database.Context,
            new DevelopmentCurrentUserService(database.Context),
            connectionService,
            sync,
            NullLogger<ConnectionsController>.Instance);

        var action = await controller.GetAll(default);

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var response = Assert.IsType<ConnectionResponse[]>(ok.Value);
        Assert.Equal([first.Connection.Id, second.Connection.Id], response.Select(x => x.BankConnectionId));
    }

    private static FinanceTransaction Transaction(Guid accountId, string plaidId, DateOnly date, DateTimeOffset createdAt) => new()
    {
        Id = Guid.NewGuid(),
        FinancialAccountId = accountId,
        PlaidTransactionId = plaidId,
        Date = date,
        Name = plaidId,
        Amount = 10m,
        CurrencyCode = "USD",
        CreatedAt = createdAt,
        UpdatedAt = createdAt
    };
}
