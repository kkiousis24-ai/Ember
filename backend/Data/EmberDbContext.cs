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

    public DbSet<Transaction> Transactions => Set<Transaction>();

    public DbSet<Budget> Budgets => Set<Budget>();

    public DbSet<BusinessGoal> BusinessGoals => Set<BusinessGoal>();

    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
}
