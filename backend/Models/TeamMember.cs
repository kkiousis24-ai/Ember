using System.ComponentModel.DataAnnotations;

namespace Ember.Api.Models;

public sealed class TeamMember
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string OwnerUserId { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Name { get; set; }

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "Member";

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    public DateTime InvitedAtUtc { get; set; } = DateTime.UtcNow;
}
