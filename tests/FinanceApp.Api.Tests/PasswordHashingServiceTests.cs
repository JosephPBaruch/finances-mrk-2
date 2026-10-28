using FinanceApp.Api.Services;

namespace FinanceApp.Api.Tests;

public sealed class PasswordHashingServiceTests
{
    private readonly Pbkdf2PasswordHashingService _service = new();

    [Fact]
    public void Hash_UsesUniqueSalt_AndVerifiesOnlyMatchingPassword()
    {
        const string password = "a-long-admin-password";
        var first = _service.Hash(password);
        var second = _service.Hash(password);

        Assert.NotEqual(first, second);
        Assert.True(_service.Verify(password, first));
        Assert.False(_service.Verify("incorrect-password", first));
        Assert.False(_service.Verify(password, "not-a-valid-hash"));
    }
}
