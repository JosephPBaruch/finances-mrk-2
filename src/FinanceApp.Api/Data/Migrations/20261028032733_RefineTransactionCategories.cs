using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceApp.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefineTransactionCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989001"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989002"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989003"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989004"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989005"));

            migrationBuilder.AddColumn<string>(
                name: "BudgetBucket",
                table: "Categories",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "BudgetBucket", "CreatedAt", "Description", "Name", "UserId" },
                values: new object[,]
                {
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989001"), null, new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Paychecks, deposits, and incoming transfers", "Income", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989002"), "Fixed Necessities", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Rent, mortgage, and housing costs", "Housing", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989003"), "Fixed Necessities", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Power, water, phone, and internet", "Utilities", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989004"), "Variable Necessities", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Food and household essentials", "Groceries", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989005"), "Lifestyle & Fun", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Restaurants, coffee, and takeout", "Dining", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989006"), "Variable Necessities", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Fuel, transit, rideshare, and vehicle costs", "Transportation", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989007"), "Variable Necessities", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Healthcare, pharmacy, and insurance costs", "Medical", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989008"), "Fixed Necessities", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Loan and credit payments", "Debt Payments", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989009"), "Lifestyle & Fun", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Retail and discretionary purchases", "Shopping", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989010"), "Lifestyle & Fun", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Streaming, events, games, and recreation", "Entertainment", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989011"), "Irregular & Sinking Funds", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Flights, lodging, and travel costs", "Travel", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989012"), "Lifestyle & Fun", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Personal services and care", "Personal Care", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989013"), "Variable Necessities", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Tuition, books, and education costs", "Education", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989014"), "Savings & Investing", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Savings contributions and reserves", "Savings", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989015"), "Savings & Investing", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Brokerage and retirement contributions", "Investments", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989016"), "Irregular & Sinking Funds", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Bank and service fees", "Fees", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989017"), "Irregular & Sinking Funds", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Gifts, charity, and donations", "Gifts & Donations", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989018"), null, new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Transfers that should not count as spending", "Transfers", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989019"), "Lifestyle & Fun", new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Transactions that do not fit another category", "Other", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989001"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989002"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989003"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989004"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989005"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989006"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989007"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989008"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989009"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989010"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989011"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989012"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989013"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989014"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989015"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989016"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989017"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989018"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("c72c15e4-f0f0-4bd4-9ca1-b2cf8d989019"));

            migrationBuilder.DropColumn(
                name: "BudgetBucket",
                table: "Categories");

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "CreatedAt", "Description", "Name", "UserId" },
                values: new object[,]
                {
                    { new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989001"), new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Default personal-finance budget category", "Fixed Necessities", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989002"), new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Default personal-finance budget category", "Variable Necessities", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989003"), new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Default personal-finance budget category", "Savings & Investing", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989004"), new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Default personal-finance budget category", "Lifestyle & Fun", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") },
                    { new Guid("b72c15e4-f0f0-4bd4-9ca1-b2cf8d989005"), new DateTimeOffset(new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Default personal-finance budget category", "Irregular & Sinking Funds", new Guid("79dce62a-54f4-43d7-9b4c-a99866858727") }
                });
        }
    }
}
