using Ember.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ember.Api.Data;

public sealed class EmberDbContext : IdentityDbContext<ApplicationUser>
{
    public EmberDbContext(DbContextOptions<EmberDbContext> options)
        : base(options)
    {
    }
}