namespace FinanceApp.Api.Data;

public sealed record DefaultCategoryDefinition(Guid Id, string Name, string? BudgetBucket, string Description);

public static class DefaultCategories
{
    public static readonly Guid IncomeId = Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989001");

    public static readonly IReadOnlyCollection<DefaultCategoryDefinition> All =
    [
        new(IncomeId, "Income", null, "Paychecks, deposits, and incoming transfers"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989002"), "Housing", "Fixed Necessities", "Rent, mortgage, and housing costs"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989003"), "Utilities", "Fixed Necessities", "Power, water, phone, and internet"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989004"), "Groceries", "Variable Necessities", "Food and household essentials"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989005"), "Dining", "Lifestyle & Fun", "Restaurants, coffee, and takeout"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989006"), "Transportation", "Variable Necessities", "Fuel, transit, rideshare, and vehicle costs"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989007"), "Medical", "Variable Necessities", "Healthcare, pharmacy, and insurance costs"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989008"), "Debt Payments", "Fixed Necessities", "Loan and credit payments"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989009"), "Shopping", "Lifestyle & Fun", "Retail and discretionary purchases"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989010"), "Entertainment", "Lifestyle & Fun", "Streaming, events, games, and recreation"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989011"), "Travel", "Irregular & Sinking Funds", "Flights, lodging, and travel costs"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989012"), "Personal Care", "Lifestyle & Fun", "Personal services and care"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989013"), "Education", "Variable Necessities", "Tuition, books, and education costs"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989014"), "Savings", "Savings & Investing", "Savings contributions and reserves"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989015"), "Investments", "Savings & Investing", "Brokerage and retirement contributions"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989016"), "Fees", "Irregular & Sinking Funds", "Bank and service fees"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989017"), "Gifts & Donations", "Irregular & Sinking Funds", "Gifts, charity, and donations"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989018"), "Transfers", null, "Transfers that should not count as spending"),
        new(Guid.Parse("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989019"), "Other", "Lifestyle & Fun", "Transactions that do not fit another category")
    ];
}
