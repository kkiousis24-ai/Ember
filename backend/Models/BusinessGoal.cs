using System.ComponentModel.DataAnnotations;

namespace Ember.Api.Models;

public sealed class BusinessGoal
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(40)]
    public string GoalType { get; set; } = "Custom";

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal TargetAmount { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal CurrentAmount { get; set; }

    public DateTime? DeadlineUtc { get; set; }

    [MaxLength(300)]
    public string? Notes { get; set; }

    [MaxLength(3)]
    public string Currency { get; set; } = "EUR";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
