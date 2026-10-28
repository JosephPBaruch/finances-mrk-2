using FinanceApp.Api.Models;

namespace FinanceApp.Api.DTOs;

public static class DtoMappings
{
    public static AccountResponse ToResponse(this FinancialAccount account) => new(
        account.Id, account.BankConnectionId, account.Name, account.OfficialName, account.Type,
        account.Subtype, account.Mask, account.CurrentBalance, account.AvailableBalance,
        account.CurrencyCode, account.UpdatedAt);

    public static ConnectionResponse ToResponse(this BankConnection connection) => new(
        connection.Id, connection.InstitutionId, connection.InstitutionName, connection.Status.ToString(),
        connection.LastSuccessfulSyncAt, connection.CreatedAt, connection.UpdatedAt,
        connection.Accounts.OrderBy(x => x.Name).Select(x => x.ToResponse()).ToArray());

    public static TransactionResponse ToResponse(this FinanceTransaction transaction) => new(
        transaction.Id, transaction.FinancialAccountId, transaction.PlaidTransactionId,
        transaction.Date, transaction.AuthorizedDate, transaction.Name, transaction.MerchantName,
        transaction.Amount, transaction.CurrencyCode, transaction.Pending,
        transaction.PlaidPrimaryCategory, transaction.PlaidDetailedCategory,
        transaction.PlaidCategoryConfidence, transaction.UserCategoryId,
        transaction.UserCategory?.Name,
        transaction.UserCategory?.BudgetBucket,
        transaction.IsReviewed, transaction.IsResolved, transaction.Notes, transaction.UpdatedAt);
}
