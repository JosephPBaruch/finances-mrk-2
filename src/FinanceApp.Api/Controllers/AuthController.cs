using System.Security.Claims;
using FinanceApp.Api.Data;
using FinanceApp.Api.DTOs;
using FinanceApp.Api.Models;
using FinanceApp.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(FinanceDbContext dbContext, IPasswordHashingService passwordHashingService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("status")]
    public async Task<ActionResult<AuthStatusResponse>> Status(CancellationToken cancellationToken)
    {
        var admin = await GetAdminAsync(cancellationToken);
        return Ok(new AuthStatusResponse(
            User.Identity?.IsAuthenticated == true,
            string.IsNullOrWhiteSpace(admin.PasswordHash),
            admin.Email,
            admin.DisplayName));
    }

    [AllowAnonymous]
    [HttpPost("setup")]
    public async Task<ActionResult<AuthStatusResponse>> Setup(PasswordRequest request, CancellationToken cancellationToken)
    {
        var admin = await GetAdminAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(admin.PasswordHash))
            return Conflict(new ProblemDetails { Status = 409, Title = "Admin setup is already complete", Detail = "Password changes are disabled through the API." });

        admin.PasswordHash = passwordHashingService.Hash(request.Password);
        admin.PasswordSetAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        await SignInAsync(admin);
        return Ok(new AuthStatusResponse(true, false, admin.Email, admin.DisplayName));
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthStatusResponse>> Login(PasswordRequest request, CancellationToken cancellationToken)
    {
        var admin = await GetAdminAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(admin.PasswordHash))
            return Conflict(new ProblemDetails { Status = 409, Title = "Admin setup required", Detail = "Set the initial admin password before signing in." });
        if (!passwordHashingService.Verify(request.Password, admin.PasswordHash))
            return Unauthorized(new ProblemDetails { Status = 401, Title = "Sign-in failed", Detail = "The password is incorrect." });

        await SignInAsync(admin);
        return Ok(new AuthStatusResponse(true, false, admin.Email, admin.DisplayName));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    private Task<User> GetAdminAsync(CancellationToken cancellationToken) =>
        dbContext.Users.SingleAsync(x => x.IsAdmin, cancellationToken);

    private Task SignInAsync(User admin)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
            new Claim(ClaimTypes.Name, admin.DisplayName),
            new Claim(ClaimTypes.Email, admin.Email),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
        return HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal, new AuthenticationProperties
        {
            IsPersistent = true,
            ExpiresUtc = DateTimeOffset.UtcNow.AddDays(14),
            AllowRefresh = true
        });
    }
}
