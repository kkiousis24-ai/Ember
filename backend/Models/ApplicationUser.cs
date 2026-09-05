using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace Ember.Api.Models;

public sealed class ApplicationUser : IdentityUser
{
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime TrialEndsAtUtc { get; set; } = DateTime.UtcNow.AddDays(14);

    public SubscriptionPlan Plan { get; set; } = SubscriptionPlan.Trial;

    public DateTime? SubscriptionEndsAtUtc { get; set; }

    [MaxLength(5)]
    public string PreferredLanguage { get; set; } = "el";

    [MaxLength(10)]
    public string PreferredTheme { get; set; } = "dark";
}

public enum SubscriptionPlan
{
    Trial = 0,
    Basic = 1,
    Professional = 2,
    Business = 3
}