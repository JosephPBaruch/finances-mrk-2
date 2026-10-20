namespace FinanceApp.Api.Services;

public sealed class PlaidApiException : Exception
{
    public PlaidApiException(string errorCode, string errorType, string safeMessage, int? statusCode = null, string? requestId = null)
        : base(safeMessage)
    {
        ErrorCode = errorCode;
        ErrorType = errorType;
        StatusCode = statusCode;
        RequestId = requestId;
    }

    public string ErrorCode { get; }
    public string ErrorType { get; }
    public int? StatusCode { get; }
    public string? RequestId { get; }
}

public sealed class DuplicateConnectionException(string message) : Exception(message);
public sealed class ResourceNotFoundException(string message) : Exception(message);
public sealed class ForbiddenOperationException(string message) : Exception(message);
public sealed class SyncFailedException(string message, Exception? innerException = null) : Exception(message, innerException);
