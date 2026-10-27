using FinanceApp.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;

namespace FinanceApp.Api.Tests;

public sealed class ApiValidationProblemDetailsFactoryTests
{
    [Fact]
    public void Create_ReturnsDescriptiveDateValidationProblem()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/api/transactions";
        httpContext.TraceIdentifier = "trace-test";
        var modelState = new ModelStateDictionary();
        modelState.AddModelError("startDate", "The value 'not-a-date' is not valid.");
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor(), modelState);

        var result = Assert.IsType<BadRequestObjectResult>(ApiValidationProblemDetailsFactory.Create(actionContext));
        var problem = Assert.IsType<ValidationProblemDetails>(result.Value);

        Assert.Equal(StatusCodes.Status400BadRequest, problem.Status);
        Assert.Equal("Request validation failed", problem.Title);
        Assert.Equal("/api/transactions", problem.Instance);
        Assert.Equal("startDate must be a valid calendar date in YYYY-MM-DD format, for example 2026-10-26.",
            Assert.Single(problem.Errors["startDate"]));
        Assert.Equal("trace-test", problem.Extensions["traceId"]);
    }
}
