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
[Route("api/team")]
public sealed class TeamController : ControllerBase
{
    private static readonly string[] AllowedRoles = ["Admin", "Member"];

    private readonly EmberDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public TeamController(
        EmberDbContext db,
        UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TeamMemberResponse>>> GetAll()
    {
        var ownerUserId = _userManager.GetUserId(User);

        if (ownerUserId is null)
        {
            return Unauthorized();
        }

        var members = await _db.TeamMembers
            .AsNoTracking()
            .Where(member => member.OwnerUserId == ownerUserId)
            .OrderBy(member => member.Status)
            .ThenBy(member => member.Email)
            .ToListAsync();

        return Ok(members.Select(ToResponse).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<TeamMemberResponse>> Invite(
        InviteTeamMemberRequest request)
    {
        if (!AllowedRoles.Contains(request.Role, StringComparer.OrdinalIgnoreCase))
        {
            ModelState.AddModelError(
                nameof(request.Role),
                "Ο ρόλος πρέπει να είναι Admin ή Member.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var ownerUserId = _userManager.GetUserId(User);

        if (ownerUserId is null)
        {
            return Unauthorized();
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var owner = await _userManager.FindByIdAsync(ownerUserId);

        if (owner?.Email?.Equals(email, StringComparison.OrdinalIgnoreCase) == true)
        {
            return Conflict(new
            {
                title = "Ο χρήστης είναι ήδη owner.",
                detail = "Δεν μπορείς να προσκαλέσεις τον εαυτό σου στην ομάδα."
            });
        }

        var exists = await _db.TeamMembers.AnyAsync(member =>
            member.OwnerUserId == ownerUserId && member.Email == email);

        if (exists)
        {
            return Conflict(new
            {
                title = "Το μέλος υπάρχει ήδη.",
                detail = "Υπάρχει ήδη πρόσκληση για αυτό το email."
            });
        }

        var existingUser = await _userManager.FindByEmailAsync(email);
        var member = new TeamMember
        {
            OwnerUserId = ownerUserId,
            Email = email,
            Name = string.IsNullOrWhiteSpace(request.Name)
                ? existingUser?.FullName
                : request.Name.Trim(),
            Role = NormalizeRole(request.Role),
            Status = existingUser is null ? "Pending" : "Active"
        };

        _db.TeamMembers.Add(member);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetAll),
            new { id = member.Id },
            ToResponse(member));
    }

    [HttpPut("{id:guid}/role")]
    public async Task<ActionResult<TeamMemberResponse>> UpdateRole(
        Guid id,
        UpdateTeamRoleRequest request)
    {
        if (!AllowedRoles.Contains(request.Role, StringComparer.OrdinalIgnoreCase))
        {
            ModelState.AddModelError(
                nameof(request.Role),
                "Ο ρόλος πρέπει να είναι Admin ή Member.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var ownerUserId = _userManager.GetUserId(User);

        if (ownerUserId is null)
        {
            return Unauthorized();
        }

        var member = await _db.TeamMembers.SingleOrDefaultAsync(item =>
            item.Id == id && item.OwnerUserId == ownerUserId);

        if (member is null)
        {
            return NotFound();
        }

        member.Role = NormalizeRole(request.Role);
        await _db.SaveChangesAsync();

        return Ok(ToResponse(member));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id)
    {
        var ownerUserId = _userManager.GetUserId(User);

        if (ownerUserId is null)
        {
            return Unauthorized();
        }

        var member = await _db.TeamMembers.SingleOrDefaultAsync(item =>
            item.Id == id && item.OwnerUserId == ownerUserId);

        if (member is null)
        {
            return NotFound();
        }

        _db.TeamMembers.Remove(member);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private static string NormalizeRole(string role) =>
        role.Equals("Admin", StringComparison.OrdinalIgnoreCase)
            ? "Admin"
            : "Member";

    private static TeamMemberResponse ToResponse(TeamMember member) =>
        new(
            member.Id,
            member.Email,
            member.Name,
            member.Role,
            member.Status,
            member.InvitedAtUtc);
}

public sealed class InviteTeamMemberRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Name { get; set; }

    [Required]
    public string Role { get; set; } = "Member";
}

public sealed class UpdateTeamRoleRequest
{
    [Required]
    public string Role { get; set; } = "Member";
}

public sealed record TeamMemberResponse(
    Guid Id,
    string Email,
    string? Name,
    string Role,
    string Status,
    DateTime InvitedAtUtc);
