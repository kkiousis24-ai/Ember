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
[Route("api/transactions")]
public sealed class TransactionsController : ControllerBase
{
    private readonly EmberDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public TransactionsController(
        EmberDbContext db,
        UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TransactionResponse>>> GetAll()
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var transactions = await _db.Transactions
            .AsNoTracking()
            .Where(transaction => transaction.UserId == userId)
            .OrderByDescending(transaction => transaction.OccurredAtUtc)
            .Select(transaction => new TransactionResponse(
                transaction.Id,
                transaction.Description,
                transaction.Amount,
                transaction.Type,
                transaction.Category,
                transaction.OccurredAtUtc,
                transaction.Currency,
                transaction.IsRecurring))
            .ToListAsync();

        return Ok(transactions);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TransactionResponse>> GetById(Guid id)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var transaction = await _db.Transactions
            .AsNoTracking()
            .Where(item => item.Id == id && item.UserId == userId)
            .Select(item => new TransactionResponse(
                item.Id,
                item.Description,
                item.Amount,
                item.Type,
                item.Category,
                item.OccurredAtUtc,
                item.Currency,
                item.IsRecurring))
            .SingleOrDefaultAsync();

        if (transaction is null)
        {
            return NotFound();
        }

        return Ok(transaction);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionResponse>> Create(
        CreateTransactionRequest request)
    {
        if (request.Amount <= 0)
        {
            ModelState.AddModelError(
                nameof(request.Amount),
                "Το ποσό πρέπει να είναι μεγαλύτερο από μηδέν.");
        }

        if (!Enum.IsDefined(typeof(TransactionType), request.Type))
        {
            ModelState.AddModelError(
                nameof(request.Type),
                "Ο τύπος συναλλαγής δεν είναι έγκυρος.");
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

        var transaction = new Transaction
        {
            UserId = userId,
            Description = request.Description.Trim(),
            Amount = request.Amount,
            Type = request.Type,
            Category = string.IsNullOrWhiteSpace(request.Category)
                ? "Άλλο"
                : request.Category.Trim(),
            OccurredAtUtc = request.OccurredAtUtc?.ToUniversalTime()
                ?? DateTime.UtcNow,
            IsRecurring = request.IsRecurring
        };

        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        var response = new TransactionResponse(
            transaction.Id,
            transaction.Description,
            transaction.Amount,
            transaction.Type,
            transaction.Category,
            transaction.OccurredAtUtc,
            transaction.Currency,
            transaction.IsRecurring);

        return CreatedAtAction(
            nameof(GetById),
            new { id = transaction.Id },
            response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TransactionResponse>> Update(
        Guid id,
        UpdateTransactionRequest request)
    {
        if (request.Amount <= 0)
        {
            ModelState.AddModelError(
                nameof(request.Amount),
                "Το ποσό πρέπει να είναι μεγαλύτερο από μηδέν.");
        }

        if (!Enum.IsDefined(typeof(TransactionType), request.Type))
        {
            ModelState.AddModelError(
                nameof(request.Type),
                "Ο τύπος συναλλαγής δεν είναι έγκυρος.");
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

        var transaction = await _db.Transactions
            .SingleOrDefaultAsync(item =>
                item.Id == id && item.UserId == userId);

        if (transaction is null)
        {
            return NotFound();
        }

        transaction.Description = request.Description.Trim();
        transaction.Amount = request.Amount;
        transaction.Type = request.Type;
        transaction.Category = string.IsNullOrWhiteSpace(request.Category)
            ? "Άλλο"
            : request.Category.Trim();

        // Αν δεν σταλούν αυτά τα πεδία, κρατάμε τις υπάρχουσες τιμές.
        transaction.OccurredAtUtc = request.OccurredAtUtc?.ToUniversalTime()
            ?? transaction.OccurredAtUtc;
        transaction.IsRecurring = request.IsRecurring
            ?? transaction.IsRecurring;

        await _db.SaveChangesAsync();

        var response = new TransactionResponse(
            transaction.Id,
            transaction.Description,
            transaction.Amount,
            transaction.Type,
            transaction.Category,
            transaction.OccurredAtUtc,
            transaction.Currency,
            transaction.IsRecurring);

        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var transaction = await _db.Transactions
            .SingleOrDefaultAsync(item =>
                item.Id == id && item.UserId == userId);

        if (transaction is null)
        {
            return NotFound();
        }

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public sealed class CreateTransactionRequest
{
    [Required]
    [MaxLength(160)]
    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public TransactionType Type { get; set; }

    [MaxLength(80)]
    public string? Category { get; set; }

    public DateTime? OccurredAtUtc { get; set; }

    public bool IsRecurring { get; set; }
}

public sealed class UpdateTransactionRequest
{
    [Required]
    [MaxLength(160)]
    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public TransactionType Type { get; set; }

    [MaxLength(80)]
    public string? Category { get; set; }

    public DateTime? OccurredAtUtc { get; set; }

    public bool? IsRecurring { get; set; }
}

public sealed record TransactionResponse(
    Guid Id,
    string Description,
    decimal Amount,
    TransactionType Type,
    string Category,
    DateTime OccurredAtUtc,
    string Currency,
    bool IsRecurring);