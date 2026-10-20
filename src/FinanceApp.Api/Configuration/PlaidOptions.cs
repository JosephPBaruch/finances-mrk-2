using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.Configuration;

public sealed class PlaidOptions
{
    public const string SectionName = "Plaid";

    public string ClientId { get; init; } = string.Empty;
    public string Secret { get; init; } = string.Empty;

    [RegularExpression("^(sandbox|production)$", ErrorMessage = "Plaid environment must be sandbox or production.")]
    public string Environment { get; init; } = "sandbox";

    public string[] Products { get; init; } = ["transactions"];
    public string[] CountryCodes { get; init; } = ["US"];

    public Uri BaseUri => Environment.Equals("production", StringComparison.OrdinalIgnoreCase)
        ? new Uri("https://production.plaid.com/")
        : new Uri("https://sandbox.plaid.com/");
}
