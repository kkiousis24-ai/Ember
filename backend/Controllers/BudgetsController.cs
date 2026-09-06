using System.ComponentModel.DataAnnotations;
using Ember.Api.Data;
using Ember.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ember.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/budgets")]
public sealed class BudgetsController : ControllerBase
{
    private readonly EmberDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public BudgetsController(
        EmberDbContext db,
        UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BudgetResponse>>> GetAll()
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(
            now.Year,
            now.Month,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);
        var startOfNextMonth = startOfMonth.AddMonths(1);

        var budgets = await _db.Budgets
            .AsNoTracking()
            .Where(budget =>
                budget.UserId == userId &&
                budget.Month == now.Month &&
                budget.Year == now.Year)
            .OrderBy(budget => budget.Category)
            .ToListAsync();

        var expenses = await _db.Transactions
            .AsNoTracking()
            .Where(transaction =>
                transaction.UserId == userId &&
                transaction.Type == TransactionType.Expense &&
                transaction.OccurredAtUtc >= startOfMonth &&
                transaction.OccurredAtUtc < startOfNextMonth)
            .GroupBy(transaction => transaction.Category)
            .Select(group => new
            {
                Category = group.Key,
                Amount = group.Sum(transaction => transaction.Amount)
            })
            .ToListAsync();

        var spentByCategory = expenses.ToDictionary(
            item => item.Category,
            item => item.Amount,
            StringComparer.OrdinalIgnoreCase);

        return Ok(budgets.Select(budget => ToResponse(
            budget,
            spentByCategory.TryGetValue(budget.Category, out var spent)
                ? spent
                : 0m)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BudgetResponse>> GetById(Guid id)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var budget = await _db.Budgets
            .AsNoTracking()
            .SingleOrDefaultAsync(item =>
                item.Id == id && item.UserId == userId);

        if (budget is null)
        {
            return NotFound();
        }

        var spent = await GetSpentAmount(
            userId,
            budget.Category,
            budget.Month,
            budget.Year);

        return Ok(ToResponse(budget, spent));
    }

    [HttpPost]
    public async Task<ActionResult<BudgetResponse>> Create(
        CreateBudgetRequest request)
    {
        if (request.LimitAmount <= 0)
        {
            ModelState.AddModelError(
                nameof(request.LimitAmount),
                "Το όριο πρέπει να είναι μεγαλύτερο από μηδέν.");
        }

        if (request.Month is < 1 or > 12)
        {
            ModelState.AddModelError(
                nameof(request.Month),
                "Ο μήνας δεν είναι έγκυρος.");
        }

        if (request.Year is < 2000 or > 9999)
        {
            ModelState.AddModelError(
                nameof(request.Year),
                "Το έτος δεν είναι έγκυρο.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var category = request.Category.Trim();
        var exists = await _db.Budgets.AnyAsync(budget =>
            budget.UserId == userId &&
            budget.Category == category &&
            budget.Month == request.Month &&
            budget.Year == request.Year);

        if (exists)
        {
            return Conflict(new
            {
                title = "Υπάρχει ήδη προϋπολογισμός.",
                detail = "Υπάρχει ήδη προϋπολογισμός για αυτή την κατηγορία και περίοδο."
            });
        }

        var budget = new Budget
        {
            UserId = userId,
            Category = category,
            LimitAmount = request.LimitAmount,
            Month = request.Month,
            Year = request.Year,
            Currency = "EUR"
        };

        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = budget.Id },
            ToResponse(budget, 0m));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BudgetResponse>> Update(
        Guid id,
        UpdateBudgetRequest request)
    {
        if (request.LimitAmount <= 0)
        {
            ModelState.AddModelError(
                nameof(request.LimitAmount),
                "Το όριο πρέπει να είναι μεγαλύτερο από μηδέν.");
        }

        if (request.Month is < 1 or > 12)
        {
            ModelState.AddModelError(
                nameof(request.Month),
                "Ο μήνας δεν είναι έγκυρος.");
        }

        if (request.Year is < 2000 or > 9999)
        {
            ModelState.AddModelError(
                nameof(request.Year),
                "Το έτος δεν είναι έγκυρο.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var budget = await _db.Budgets
            .SingleOrDefaultAsync(item =>
                item.Id == id && item.UserId == userId);

        if (budget is null)
        {
            return NotFound();
        }

        var category = request.Category.Trim();
        var duplicate = await _db.Budgets.AnyAsync(item =>
            item.Id != id &&
            item.UserId == userId &&
            item.Category == category &&
            item.Month == request.Month &&
            item.Year == request.Year);

        if (duplicate)
        {
            return Conflict(new
            {
                title = "Υπάρχει ήδη προϋπολογισμός.",
                detail = "Υπάρχει ήδη προϋπολογισμός για αυτή την κατηγορία και περίοδο."
            });
        }

        budget.Category = category;
        budget.LimitAmount = request.LimitAmount;
        budget.Month = request.Month;
        budget.Year = request.Year;

        await _db.SaveChangesAsync();

        var spent = await GetSpentAmount(
            userId,
            budget.Category,
            budget.Month,
            budget.Year);

        return Ok(ToResponse(budget, spent));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var budget = await _db.Budgets
            .SingleOrDefaultAsync(item =>
                item.Id == id && item.UserId == userId);

        if (budget is null)
        {
            return NotFound();
        }

        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<decimal> GetSpentAmount(
        string userId,
        string category,
        int month,
        int year)
    {
        var startOfMonth = new DateTime(
            year,
            month,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc);
        var startOfNextMonth = startOfMonth.AddMonths(1);

        return await _db.Transactions
            .AsNoTracking()
            .Where(transaction =>
                transaction.UserId == userId &&
                transaction.Type == TransactionType.Expense &&
                transaction.Category == category &&
                transaction.OccurredAtUtc >= startOfMonth &&
                transaction.OccurredAtUtc < startOfNextMonth)
            .SumAsync(transaction => (decimal?)transaction.Amount) ?? 0m;
    }

    private static BudgetResponse ToResponse(
        Budget budget,
        decimal spentAmount)
    {
        var progressPercentage = budget.LimitAmount <= 0
            ? 0m
            : Math.Round(
                spentAmount / budget.LimitAmount * 100m,
                1);

        return new BudgetResponse(
            budget.Id,
            budget.Category,
            budget.LimitAmount,
            spentAmount,
            budget.LimitAmount - spentAmount,
            progressPercentage,
            budget.Month,
            budget.Year,
            budget.Currency);
    }
}

public sealed class CreateBudgetRequest
{
    [Required]
    [MaxLength(80)]
    public string Category { get; set; } = string.Empty;

    public decimal LimitAmount { get; set; }

    public int Month { get; set; } = DateTime.UtcNow.Month;

    public int Year { get; set; } = DateTime.UtcNow.Year;
}

public sealed class UpdateBudgetRequest
{
    [Required]
    [MaxLength(80)]
    public string Category { get; set; } = string.Empty;

    public decimal LimitAmount { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }
}

public sealed record BudgetResponse(
    Guid Id,
    string Category,
    decimal LimitAmount,
    decimal SpentAmount,
    decimal RemainingAmount,
    decimal ProgressPercentage,
    int Month,
    int Year,
    string Currency);

