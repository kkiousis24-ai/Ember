using System;
using System.ComponentModel.DataAnnotations;

namespace Ember.Api.Models;

public enum MeetingStatus
{
    Scheduled = 1,
    Completed = 2,
    Cancelled = 3
}

public sealed class Meeting
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(160)]
    public string Title { get; set; } = string.Empty;

    public DateTime StartsAtUtc { get; set; }

    public DateTime EndsAtUtc { get; set; }

    [MaxLength(240)]
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public MeetingStatus Status { get; set; } = MeetingStatus.Scheduled;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
