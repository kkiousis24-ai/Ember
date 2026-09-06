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
[Route("api/goals")]
public sealed class GoalsController : ControllerBase
{
    private readonly EmberDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public GoalsController(
        EmberDbContext db,
        UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BusinessGoalResponse>>> GetAll()
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var goals = await _db.BusinessGoals
            .AsNoTracking()
            .Where(goal => goal.UserId == userId)
            .OrderByDescending(goal => goal.CreatedAtUtc)
            .ToListAsync();

        return Ok(goals.Select(ToResponse).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BusinessGoalResponse>> GetById(Guid id)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var goal = await _db.BusinessGoals
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId);

        return goal is null ? NotFound() : Ok(ToResponse(goal));
    }

    [HttpPost]
    public async Task<ActionResult<BusinessGoalResponse>> Create(
        SaveBusinessGoalRequest request)
    {
        ValidateRequest(request);

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var goal = new BusinessGoal
        {
            UserId = userId,
            Name = request.Name.Trim(),
            GoalType = string.IsNullOrWhiteSpace(request.GoalType)
                ? "Custom"
                : request.GoalType.Trim(),
            TargetAmount = request.TargetAmount,
            CurrentAmount = request.CurrentAmount,
            DeadlineUtc = request.DeadlineUtc?.ToUniversalTime(),
            Notes = string.IsNullOrWhiteSpace(request.Notes)
                ? null
                : request.Notes.Trim(),
            Currency = "EUR"
        };

        _db.BusinessGoals.Add(goal);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = goal.Id },
            ToResponse(goal));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BusinessGoalResponse>> Update(
        Guid id,
        SaveBusinessGoalRequest request)
    {
        ValidateRequest(request);

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var goal = await _db.BusinessGoals
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId);

        if (goal is null)
        {
            return NotFound();
        }

        goal.Name = request.Name.Trim();
        goal.GoalType = string.IsNullOrWhiteSpace(request.GoalType)
            ? "Custom"
            : request.GoalType.Trim();
        goal.TargetAmount = request.TargetAmount;
        goal.CurrentAmount = request.CurrentAmount;
        goal.DeadlineUtc = request.DeadlineUtc?.ToUniversalTime();
        goal.Notes = string.IsNullOrWhiteSpace(request.Notes)
            ? null
            : request.Notes.Trim();

        await _db.SaveChangesAsync();

        return Ok(ToResponse(goal));
    }

    [HttpPost("{id:guid}/contributions")]
    public async Task<ActionResult<BusinessGoalResponse>> AddContribution(
        Guid id,
        AddContributionRequest request)
    {
        if (request.Amount <= 0)
        {
            ModelState.AddModelError(
                nameof(request.Amount),
                "Το ποσό πρέπει να είναι μεγαλύτερο από μηδέν.");
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

        var goal = await _db.BusinessGoals
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId);

        if (goal is null)
        {
            return NotFound();
        }

        goal.CurrentAmount += request.Amount;
        await _db.SaveChangesAsync();

        return Ok(ToResponse(goal));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var goal = await _db.BusinessGoals
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId);

        if (goal is null)
        {
            return NotFound();
        }

        _db.BusinessGoals.Remove(goal);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private void ValidateRequest(SaveBusinessGoalRequest request)
    {
        if (request.TargetAmount <= 0)
        {
            ModelState.AddModelError(
                nameof(request.TargetAmount),
                "Ο στόχος πρέπει να είναι μεγαλύτερος από μηδέν.");
        }

        if (request.CurrentAmount < 0)
        {
            ModelState.AddModelError(
                nameof(request.CurrentAmount),
                "Η τρέχουσα πρόοδος δεν μπορεί να είναι αρνητική.");
        }
    }

    private static BusinessGoalResponse ToResponse(BusinessGoal goal)
    {
        var progress = goal.TargetAmount <= 0
            ? 0
            : Math.Round(goal.CurrentAmount / goal.TargetAmount * 100m, 1);

        return new BusinessGoalResponse(
            goal.Id,
            goal.Name,
            goal.GoalType,
            goal.TargetAmount,
            goal.CurrentAmount,
            Math.Min(100m, progress),
            goal.DeadlineUtc,
            goal.Notes,
            goal.Currency,
            goal.CurrentAmount >= goal.TargetAmount,
            goal.CreatedAtUtc);
    }
}

public sealed class SaveBusinessGoalRequest
{
    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(40)]
    public string? GoalType { get; set; }

    public decimal TargetAmount { get; set; }

    public decimal CurrentAmount { get; set; }

    public DateTime? DeadlineUtc { get; set; }

    [MaxLength(300)]
    public string? Notes { get; set; }
}

public sealed class AddContributionRequest
{
    public decimal Amount { get; set; }
}

public sealed record BusinessGoalResponse(
    Guid Id,
    string Name,
    string GoalType,
    decimal TargetAmount,
    decimal CurrentAmount,
    decimal ProgressPercentage,
    DateTime? DeadlineUtc,
    string? Notes,
    string Currency,
    bool IsCompleted,
    DateTime CreatedAtUtc);
