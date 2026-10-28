using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FinanceApp.Api.DTOs;

public sealed record TransactionResponse(
    Guid TransactionId,
    Guid AccountId,
    string PlaidTransactionId,
    DateOnly Date,
    DateOnly? AuthorizedDate,
    string Name,
    string? MerchantName,
    decimal Amount,
    string? CurrencyCode,
    bool Pending,
    string? PlaidPrimaryCategory,
    string? PlaidDetailedCategory,
    string? PlaidCategoryConfidence,
    Guid? UserCategoryId,
    string? UserCategoryName,
    string? UserCategoryBudgetBucket,
    bool IsReviewed,
    string? Notes,
    DateTimeOffset UpdatedAt);

public sealed class UpdateTransactionRequest
{
    private Guid? _userCategoryId;
    private bool? _isReviewed;
    private string? _notes;

    public Guid? UserCategoryId { get => _userCategoryId; init { _userCategoryId = value; UserCategoryIdSpecified = true; } }
    public bool? IsReviewed { get => _isReviewed; init { _isReviewed = value; IsReviewedSpecified = true; } }

    [StringLength(4000)]
    public string? Notes { get => _notes; init { _notes = value; NotesSpecified = true; } }

    [JsonIgnore] public bool UserCategoryIdSpecified { get; private init; }
    [JsonIgnore] public bool IsReviewedSpecified { get; private init; }
    [JsonIgnore] public bool NotesSpecified { get; private init; }
}

public sealed record PagedResponse<T>(IReadOnlyCollection<T> Items, int Page, int PageSize, int TotalCount, int TotalPages);

public sealed record SyncResponse(int Added, int Modified, int Removed, DateTimeOffset LastSyncAt, bool HasMore);

public sealed record SyncAllItemResponse(Guid BankConnectionId, bool Succeeded, SyncResponse? Statistics, string? Error);

public sealed record SyncAllResponse(IReadOnlyCollection<SyncAllItemResponse> Results);
