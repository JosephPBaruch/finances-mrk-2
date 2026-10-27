using System.Diagnostics;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger,
    IProblemDetailsService problemDetailsService)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            logger.LogInformation("Request {TraceId} was canceled by the client", context.TraceIdentifier);
        }
        catch (Exception exception)
        {
            var (status, title, detail) = Map(exception);
            if (status >= 500)
                logger.LogError(exception, "Unhandled request failure {TraceId}", context.TraceIdentifier);
            else
                logger.LogWarning(exception, "Request failed {TraceId}", context.TraceIdentifier);

            context.Response.StatusCode = status;
            var problem = new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = detail,
                Instance = context.Request.Path,
                Type = $"https://httpstatuses.com/{status}"
            };
            problem.Extensions["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier;
            if (exception is PlaidApiException plaid && plaid.RequestId is not null)
                problem.Extensions["providerRequestId"] = plaid.RequestId;

            await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails = problem,
                Exception = exception
            });
        }
    }

    private static (int Status, string Title, string Detail) Map(Exception exception) => exception switch
    {
        ResourceNotFoundException => (404, "Resource not found", exception.Message),
        DuplicateConnectionException => (409, "Duplicate connection", exception.Message),
        ForbiddenOperationException => (403, "Operation not allowed", exception.Message),
        BadHttpRequestException => (400, "Invalid request", "The HTTP request could not be parsed or validated."),
        SyncFailedException => (409, "Synchronization failed", exception.Message),
        PlaidApiException { ErrorCode: "INVALID_PUBLIC_TOKEN" } => (400, "Invalid public token", exception.Message),
        PlaidApiException { ErrorCode: "ITEM_LOGIN_REQUIRED" } => (409, "Connection update required", exception.Message),
        PlaidApiException { ErrorCode: "RATE_LIMIT_EXCEEDED" } => (429, "Provider rate limit exceeded", exception.Message),
        PlaidApiException { ErrorCode: "PLAID_NOT_CONFIGURED" } => (503, "Plaid is not configured", exception.Message),
        PlaidApiException { StatusCode: >= 500 } => (503, "Financial data provider unavailable", exception.Message),
        PlaidApiException => (502, "Financial data provider error", exception.Message),
        DbUpdateException => (500, "Database operation failed", "The database operation could not be completed."),
        InvalidOperationException { Message: var message } when message.StartsWith("Encryption:Key", StringComparison.Ordinal)
            => (503, "Encryption is not configured", message),
        _ => (500, "Unexpected server error", "An unexpected error occurred.")
    };
}
