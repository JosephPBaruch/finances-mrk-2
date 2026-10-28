using FinanceApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceApp.Api.Data;

public sealed class FinanceDbContext(DbContextOptions<FinanceDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<BankConnection> BankConnections => Set<BankConnection>();
    public DbSet<FinancialAccount> FinancialAccounts => Set<FinancialAccount>();
    public DbSet<FinanceTransaction> Transactions => Set<FinanceTransaction>();
    public DbSet<Category> Categories => Set<Category>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(320).IsRequired();
            entity.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(1000);
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasData(new
            {
                DevelopmentUserDefaults.Id,
                Email = DevelopmentUserDefaults.Email,
                DisplayName = DevelopmentUserDefaults.DisplayName,
                IsAdmin = true,
                PasswordHash = (string?)null,
                PasswordSetAt = (DateTimeOffset?)null,
                CreatedAt = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero)
            });
        });

        modelBuilder.Entity<BankConnection>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PlaidItemId).HasMaxLength(200).IsRequired();
            entity.Property(x => x.AccessToken).IsRequired();
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.InstitutionId).HasMaxLength(100);
            entity.Property(x => x.InstitutionName).HasMaxLength(300);
            entity.HasIndex(x => new { x.UserId, x.PlaidItemId }).IsUnique();
            entity.HasOne(x => x.User).WithMany(x => x.BankConnections)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FinancialAccount>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PlaidAccountId).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(300).IsRequired();
            entity.Property(x => x.OfficialName).HasMaxLength(500);
            entity.Property(x => x.Type).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Subtype).HasMaxLength(100);
            entity.Property(x => x.Mask).HasMaxLength(20);
            entity.Property(x => x.CurrencyCode).HasMaxLength(10);
            entity.Property(x => x.CurrentBalance).HasPrecision(18, 4);
            entity.Property(x => x.AvailableBalance).HasPrecision(18, 4);
            entity.HasIndex(x => new { x.BankConnectionId, x.PlaidAccountId }).IsUnique();
            entity.HasOne(x => x.BankConnection).WithMany(x => x.Accounts)
                .HasForeignKey(x => x.BankConnectionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FinanceTransaction>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PlaidTransactionId).HasMaxLength(200).IsRequired();
            entity.Property(x => x.PlaidPendingTransactionId).HasMaxLength(200);
            entity.Property(x => x.Name).HasMaxLength(500).IsRequired();
            entity.Property(x => x.MerchantName).HasMaxLength(500);
            entity.Property(x => x.Amount).HasPrecision(18, 4);
            entity.Property(x => x.CurrencyCode).HasMaxLength(10);
            entity.Property(x => x.PlaidPrimaryCategory).HasMaxLength(200);
            entity.Property(x => x.PlaidDetailedCategory).HasMaxLength(300);
            entity.Property(x => x.PlaidCategoryConfidence).HasMaxLength(50);
            entity.Property(x => x.Notes).HasMaxLength(4000);
            entity.HasIndex(x => new { x.FinancialAccountId, x.PlaidTransactionId }).IsUnique();
            entity.HasIndex(x => new { x.FinancialAccountId, x.Date, x.IsRemoved });
            entity.HasOne(x => x.FinancialAccount).WithMany(x => x.Transactions)
                .HasForeignKey(x => x.FinancialAccountId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.UserCategory).WithMany(x => x.Transactions)
                .HasForeignKey(x => x.UserCategoryId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
            entity.HasIndex(x => new { x.UserId, x.Name }).IsUnique();
            entity.HasOne(x => x.User).WithMany(x => x.Categories)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            var createdAt = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
            entity.HasData(
                new { Id = Guid.Parse("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989001"), UserId = DevelopmentUserDefaults.Id, Name = "Fixed Necessities", Description = "Default personal-finance budget category", CreatedAt = createdAt },
                new { Id = Guid.Parse("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989002"), UserId = DevelopmentUserDefaults.Id, Name = "Variable Necessities", Description = "Default personal-finance budget category", CreatedAt = createdAt },
                new { Id = Guid.Parse("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989003"), UserId = DevelopmentUserDefaults.Id, Name = "Savings & Investing", Description = "Default personal-finance budget category", CreatedAt = createdAt },
                new { Id = Guid.Parse("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989004"), UserId = DevelopmentUserDefaults.Id, Name = "Lifestyle & Fun", Description = "Default personal-finance budget category", CreatedAt = createdAt },
                new { Id = Guid.Parse("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989005"), UserId = DevelopmentUserDefaults.Id, Name = "Irregular & Sinking Funds", Description = "Default personal-finance budget category", CreatedAt = createdAt });
        });
    }
}
