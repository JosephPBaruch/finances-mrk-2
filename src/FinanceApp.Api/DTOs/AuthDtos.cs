using System.ComponentModel.DataAnnotations;

namespace FinanceApp.Api.DTOs;

public sealed class PasswordRequest
{
    [Required, MinLength(12), MaxLength(200)]
    public required string Password { get; init; }
}

public sealed record AuthStatusResponse(
    bool IsAuthenticated,
    bool NeedsSetup,
    string Email,
    string DisplayName);
