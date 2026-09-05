using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ember.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTransactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    OccurredAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Currency = table.Column<string>(type: "TEXT", maxLength: 3, nullable: false),
                    IsRecurring = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Transactions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Transactions");
        }
    }
}
