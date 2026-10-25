using System.Net;
using System.Text;
using FinanceApp.Api.Configuration;
using FinanceApp.Api.Data;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace FinanceApp.Api.Tests;

internal sealed class TestDatabase : IAsyncDisposable
{
    private readonly SqliteConnection _connection;
    public FinanceDbContext Context { get; }

    private TestDatabase(SqliteConnection connection, FinanceDbContext context)
    {
        _connection = connection;
        Context = context;
    }

    public static async Task<TestDatabase> CreateAsync()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<FinanceDbContext>().UseSqlite(connection).Options;
        var context = new FinanceDbContext(options);
        await context.Database.EnsureCreatedAsync();
        return new TestDatabase(connection, context);
    }

    public async Task<(User User, BankConnection Connection, FinancialAccount Account)> SeedConnectionAsync(string cursor = null!)
    {
        var user = await Context.Users.SingleAsync();
        var now = DateTimeOffset.UtcNow;
        var connection = new BankConnection
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            PlaidItemId = $"item-{Guid.NewGuid():N}",
            AccessToken = Encryption.Encrypt("access-test"),
            TransactionsCursor = cursor,
            CreatedAt = now,
            UpdatedAt = now,
            Status = BankConnectionStatus.Active
        };
        var account = new FinancialAccount
        {
            Id = Guid.NewGuid(),
            BankConnectionId = connection.Id,
            PlaidAccountId = "account-1",
            Name = "Checking",
            Type = "depository",
            Subtype = "checking",
            CreatedAt = now,
            UpdatedAt = now
        };
        connection.Accounts.Add(account);
        Context.BankConnections.Add(connection);
        await Context.SaveChangesAsync();
        return (user, connection, account);
    }

    public static IEncryptionService Encryption { get; } = new AesGcmEncryptionService(
        Options.Create(new EncryptionOptions { Key = Convert.ToBase64String(Enumerable.Range(1, 32).Select(x => (byte)x).ToArray()) }));

    public async ValueTask DisposeAsync()
    {
        await Context.DisposeAsync();
        await _connection.DisposeAsync();
    }
}

internal sealed class FakePlaidService : IPlaidService
{
    public Queue<object> SyncResults { get; } = new();
    public PlaidExchangeResult ExchangeResult { get; set; } = new("access-test", "item-test");
    public PlaidAccountsResult AccountsResult { get; set; } = new("ins_1", "Test Bank", []);
    public int SyncCallCount { get; private set; }
    public List<string?> RequestedCursors { get; } = [];

    public Task<PlaidLinkTokenResult> CreateLinkTokenAsync(Guid userId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PlaidLinkTokenResult("link", DateTimeOffset.UtcNow.AddHours(4)));
    public Task<PlaidExchangeResult> ExchangePublicTokenAsync(string publicToken, CancellationToken cancellationToken = default) =>
        Task.FromResult(ExchangeResult);
    public Task<string> CreateSandboxPublicTokenAsync(string institutionId, CancellationToken cancellationToken = default) =>
        Task.FromResult("public-test");
    public Task<PlaidAccountsResult> GetAccountsAsync(string accessToken, CancellationToken cancellationToken = default) =>
        Task.FromResult(AccountsResult);
    public Task<PlaidSyncPage> SyncTransactionsAsync(string accessToken, string? cursor, CancellationToken cancellationToken = default)
    {
        SyncCallCount++;
        RequestedCursors.Add(cursor);
        var result = SyncResults.Dequeue();
        if (result is Exception exception) return Task.FromException<PlaidSyncPage>(exception);
        return Task.FromResult((PlaidSyncPage)result);
    }
}

internal sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
        Task.FromResult(handler(request));

    public static HttpResponseMessage Json(string json, HttpStatusCode status = HttpStatusCode.OK) => new(status)
    {
        Content = new StringContent(json, Encoding.UTF8, "application/json")
    };
}

internal static class TestFactories
{
    public static TransactionSyncService Synchronizer(FinanceDbContext context, FakePlaidService plaid) =>
        new(context, plaid, TestDatabase.Encryption, NullLogger<TransactionSyncService>.Instance);

    public static PlaidTransaction Transaction(string id, string accountId = "account-1", bool pending = false,
        string? pendingId = null, decimal amount = 12.34m, string name = "Coffee") =>
        new(id, accountId, pendingId, new DateOnly(2026, 10, 1), null, name, "Merchant", amount, "USD", pending,
            "FOOD_AND_DRINK", "FOOD_AND_DRINK_COFFEE", "VERY_HIGH");
}
