using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceApp.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTransactionResolution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsResolved",
                table: "Transactions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsResolved",
                table: "Transactions");
        }
    }
}
