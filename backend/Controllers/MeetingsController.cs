using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Ember.Api.Data;
using Ember.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ember.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/meetings")]
public sealed class MeetingsController : ControllerBase
{
    private readonly EmberDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public MeetingsController(
        EmberDbContext db,
        UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MeetingResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var meetings = await _db.Meetings
            .AsNoTracking()
            .Where(meeting => meeting.UserId == userId)
            .OrderBy(meeting => meeting.StartsAtUtc)
            .ThenBy(meeting => meeting.Id)
            .ToListAsync(cancellationToken);

        return Ok(meetings.Select(ToResponse).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MeetingResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var meeting = await _db.Meetings
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        if (meeting is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(meeting));
    }

    [HttpPost]
    public async Task<ActionResult<MeetingResponse>> Create(
        SaveMeetingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        ValidateRequest(request);

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var meeting = new Meeting
        {
            UserId = userId
        };

        ApplyRequest(meeting, request);
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = meeting.Id },
            ToResponse(meeting));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MeetingResponse>> Update(
        Guid id,
        SaveMeetingRequest request,
        CancellationToken cancellationToken)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        ValidateRequest(request);

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var meeting = await _db.Meetings
            .SingleOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        if (meeting is null)
        {
            return NotFound();
        }

        ApplyRequest(meeting, request);
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(meeting));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = _userManager.GetUserId(User);

        if (userId is null)
        {
            return Unauthorized();
        }

        var meeting = await _db.Meetings
            .SingleOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        if (meeting is null)
        {
            return NotFound();
        }

        _db.Meetings.Remove(meeting);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private void ValidateRequest(SaveMeetingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            ModelState.AddModelError(nameof(request.Title), "Γράψε έναν τίτλο.");
        }

        ValidateUtcDate(request.StartsAtUtc, nameof(request.StartsAtUtc));
        ValidateUtcDate(request.EndsAtUtc, nameof(request.EndsAtUtc));

        if (request.StartsAtUtc.HasValue && request.EndsAtUtc.HasValue &&
            request.EndsAtUtc.Value <= request.StartsAtUtc.Value)
        {
            ModelState.AddModelError(
                nameof(request.EndsAtUtc),
                "Η λήξη πρέπει να είναι μετά την έναρξη της συνάντησης.");
        }

        if (!Enum.IsDefined(typeof(MeetingStatus), request.Status))
        {
            ModelState.AddModelError(
                nameof(request.Status),
                "Η κατάσταση της συνάντησης δεν είναι έγκυρη.");
        }
    }

    private void ValidateUtcDate(DateTime? value, string fieldName)
    {
        if (!value.HasValue)
        {
            ModelState.AddModelError(fieldName, "Συμπλήρωσε ημερομηνία και ώρα.");
        }
        else if (value.Value.Kind != DateTimeKind.Utc)
        {
            // The frontend sends local form dates with Date.toISOString().
            ModelState.AddModelError(
                fieldName,
                "Η ημερομηνία πρέπει να αποστέλλεται σε UTC, με κατάληξη Z.");
        }
    }

    private static void ApplyRequest(Meeting meeting, SaveMeetingRequest request)
    {
        // Called only after the request has passed validation.
        meeting.Title = request.Title.Trim();
        meeting.StartsAtUtc = request.StartsAtUtc!.Value;
        meeting.EndsAtUtc = request.EndsAtUtc!.Value;
        meeting.Location = NormalizeOptionalText(request.Location);
        meeting.Notes = NormalizeOptionalText(request.Notes);
        meeting.Status = request.Status;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static MeetingResponse ToResponse(Meeting meeting)
    {
        // SQLite does not retain DateTime.Kind. These fields are stored in UTC;
        // restore that marker so JSON includes Z and browsers show local time.
        return new MeetingResponse(
            meeting.Id,
            meeting.Title,
            DateTime.SpecifyKind(meeting.StartsAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(meeting.EndsAtUtc, DateTimeKind.Utc),
            meeting.Location,
            meeting.Notes,
            meeting.Status,
            DateTime.SpecifyKind(meeting.CreatedAtUtc, DateTimeKind.Utc));
    }
}

public sealed class SaveMeetingRequest
{
    [Required(ErrorMessage = "Γράψε έναν τίτλο.")]
    [MaxLength(160, ErrorMessage = "Ο τίτλος μπορεί να έχει έως 160 χαρακτήρες.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Συμπλήρωσε ημερομηνία και ώρα έναρξης.")]
    public DateTime? StartsAtUtc { get; set; }

    [Required(ErrorMessage = "Συμπλήρωσε ημερομηνία και ώρα λήξης.")]
    public DateTime? EndsAtUtc { get; set; }

    [MaxLength(240, ErrorMessage = "Η τοποθεσία μπορεί να έχει έως 240 χαρακτήρες.")]
    public string? Location { get; set; }

    [MaxLength(1000, ErrorMessage = "Οι σημειώσεις μπορούν να έχουν έως 1000 χαρακτήρες.")]
    public string? Notes { get; set; }

    public MeetingStatus Status { get; set; } = MeetingStatus.Scheduled;
}

public sealed record MeetingResponse(
    Guid Id,
    string Title,
    DateTime StartsAtUtc,
    DateTime EndsAtUtc,
    string? Location,
    string? Notes,
    MeetingStatus Status,
    DateTime CreatedAtUtc);
