using System.Net;
using FinanceApp.Api.Configuration;
using FinanceApp.Api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace FinanceApp.Api.Tests;

public sealed class PlaidServiceTests
{
    [Fact]
    public async Task CreateLinkToken_IncludesConfiguredOAuthRedirectUri()
    {
        string? requestJson = null;
        var handler = new StubHttpMessageHandler(request =>
        {
            requestJson = request.Content!.ReadAsStringAsync().GetAwaiter().GetResult();
            return StubHttpMessageHandler.Json("""{"link_token":"link-sandbox-token","expiration":"2026-10-27T12:00:00Z"}""");
        });
        var service = new PlaidService(
            new HttpClient(handler) { BaseAddress = new Uri("https://sandbox.plaid.com/") },
            Options.Create(new PlaidOptions
            {
                ClientId = "client",
                Secret = "secret",
                RedirectUri = "https://finances.example.com/transactions"
            }),
            NullLogger<PlaidService>.Instance);

        await service.CreateLinkTokenAsync(Guid.NewGuid());

        Assert.Contains("https://finances.example.com/transactions", requestJson);
    }

    [Fact]
    public async Task ExchangePublicToken_MapsOfficialResponse_WithoutReturningCredentialsElsewhere()
    {
        string? requestJson = null;
        var handler = new StubHttpMessageHandler(request =>
        {
            requestJson = request.Content!.ReadAsStringAsync().GetAwaiter().GetResult();
            return StubHttpMessageHandler.Json("""{"access_token":"access-secret","item_id":"item-123","request_id":"request"}""");
        });
        var client = new HttpClient(handler) { BaseAddress = new Uri("https://sandbox.plaid.com/") };
        var options = Options.Create(new PlaidOptions { ClientId = "client", Secret = "secret" });
        var service = new PlaidService(client, options, NullLogger<PlaidService>.Instance);

        var result = await service.ExchangePublicTokenAsync("public-sandbox-token");

        Assert.Equal("access-secret", result.AccessToken);
        Assert.Equal("item-123", result.ItemId);
        Assert.Contains("public-sandbox-token", requestJson);
    }

    [Fact]
    public async Task ExchangePublicToken_MapsInvalidTokenToSafeException()
    {
        var handler = new StubHttpMessageHandler(_ => StubHttpMessageHandler.Json(
            """{"error_type":"INVALID_INPUT","error_code":"INVALID_PUBLIC_TOKEN","error_message":"sensitive provider detail","request_id":"req-1"}""",
            HttpStatusCode.BadRequest));
        var service = new PlaidService(new HttpClient(handler) { BaseAddress = new Uri("https://sandbox.plaid.com/") },
            Options.Create(new PlaidOptions { ClientId = "client", Secret = "secret" }), NullLogger<PlaidService>.Instance);

        var exception = await Assert.ThrowsAsync<PlaidApiException>(() => service.ExchangePublicTokenAsync("bad"));

        Assert.Equal("INVALID_PUBLIC_TOKEN", exception.ErrorCode);
        Assert.DoesNotContain("sensitive", exception.Message);
    }
}
