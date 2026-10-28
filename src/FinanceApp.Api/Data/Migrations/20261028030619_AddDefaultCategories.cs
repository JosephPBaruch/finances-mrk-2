using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FinanceApp.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDefaultCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
        }
    }
}
