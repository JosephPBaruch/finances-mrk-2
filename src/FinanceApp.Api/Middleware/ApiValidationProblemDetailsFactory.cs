using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace FinanceApp.Api.Middleware;

public static class ApiValidationProblemDetailsFactory
{
    public static IActionResult Create(ActionContext context)
    {
        var errors = context.ModelState
            .Where(x => x.Value?.Errors.Count > 0)
            .ToDictionary(
                x => x.Key,
                x => x.Value!.Errors.Select(error => FriendlyMessage(x.Key, error)).ToArray(),
                StringComparer.OrdinalIgnoreCase);

        var problem = new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Request validation failed",
            Detail = "One or more request values are invalid. Correct the fields listed in errors and try again.",
            Instance = context.HttpContext.Request.Path,
            Type = "https://httpstatuses.com/400"
        };
        problem.Extensions["traceId"] = Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;
        return new BadRequestObjectResult(problem);
    }

    private static string FriendlyMessage(string key, ModelError error)
    {
        var field = key.Split('.').LastOrDefault() ?? key;
        if (field.Equals("startDate", StringComparison.OrdinalIgnoreCase) ||
            field.Equals("endDate", StringComparison.OrdinalIgnoreCase))
            return $"{field} must be a valid calendar date in YYYY-MM-DD format, for example 2026-10-26.";

        if (field.Equals("bankConnectionId", StringComparison.OrdinalIgnoreCase) ||
            field.Equals("accountId", StringComparison.OrdinalIgnoreCase) ||
            field.Equals("transactionId", StringComparison.OrdinalIgnoreCase) ||
            field.Equals("categoryId", StringComparison.OrdinalIgnoreCase))
            return $"{field} must be a valid UUID.";

        if (field.Equals("isReviewed", StringComparison.OrdinalIgnoreCase) ||
            field.Equals("pending", StringComparison.OrdinalIgnoreCase))
            return $"{field} must be true or false.";

        if (field.Equals("page", StringComparison.OrdinalIgnoreCase) ||
            field.Equals("pageSize", StringComparison.OrdinalIgnoreCase))
            return $"{field} must be a whole number.";

        return string.IsNullOrWhiteSpace(error.ErrorMessage)
            ? "The supplied value is invalid."
            : error.ErrorMessage;
    }
}
