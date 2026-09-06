using System.ComponentModel.DataAnnotations;

namespace Ember.Api.Models;

public sealed class Budget
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(80)]
    public string Category { get; set; } = "Άλλο";

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal LimitAmount { get; set; }

    [Range(1, 12)]
    public int Month { get; set; }

    [Range(2000, 9999)]
    public int Year { get; set; }

    [MaxLength(3)]
    public string Currency { get; set; } = "EUR";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

