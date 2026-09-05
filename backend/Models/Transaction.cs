using System.ComponentModel.DataAnnotations;

namespace Ember.Api.Models;

public sealed class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;

    [Required]
    [MaxLength(160)]
    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public TransactionType Type { get; set; } = TransactionType.Expense;

    [MaxLength(80)]
    public string Category { get; set; } = "Άλλο";

    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;

    [MaxLength(3)]
    public string Currency { get; set; } = "EUR";

    public bool IsRecurring { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public enum TransactionType
{
    Income = 1,
    Expense = 2
}