using Ember.Api.Data;
using Ember.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    builder.Configuration.GetConnectionString("EmberDatabase")
    ?? throw new InvalidOperationException(
        "The Ember database connection string was not found.");

builder.Services.AddDbContext<EmberDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>()
    .AddEntityFrameworkStores<EmberDbContext>();

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = true;

    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);

    options.User.RequireUniqueEmail = true;
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("EmberFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("EmberFrontend");
app.UseAuthentication();

/*
 * The /api/auth/me endpoint remains available after the trial expires,
 * so the frontend can show the correct subscription message.
 * Financial data endpoints are blocked until the user has active access.
 */
app.Use(async (context, next) =>
{
    var isFinancialRequest =
        context.Request.Path.StartsWithSegments("/api/transactions") ||
        context.Request.Path.StartsWithSegments("/api/budgets") ||
        context.Request.Path.StartsWithSegments("/api/goals");

    if (!isFinancialRequest ||
        context.User.Identity?.IsAuthenticated != true)
    {
        await next();
        return;
    }

    var userManager =
        context.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();

    var user = await userManager.GetUserAsync(context.User);

    if (user is null)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }

    var now = DateTime.UtcNow;
    var hasActiveAccess = user.Plan == SubscriptionPlan.Trial
        ? user.TrialEndsAtUtc > now
        : user.SubscriptionEndsAtUtc is null ||
          user.SubscriptionEndsAtUtc > now;

    if (!hasActiveAccess)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;

        await context.Response.WriteAsJsonAsync(new
        {
            title = "Η δωρεάν δοκιμή ολοκληρώθηκε.",
            detail = "Επίλεξε ένα πακέτο για να συνεχίσεις να χρησιμοποιείς τις συναλλαγές.",
            code = "TRIAL_EXPIRED"
        });

        return;
    }

    await next();
});

app.UseAuthorization();

app.MapControllers();

app.MapGroup("/api/auth")
    .MapIdentityApi<ApplicationUser>();

app.MapGet("/api/auth/me", async (
    HttpContext httpContext,
    UserManager<ApplicationUser> userManager) =>
{
    var user = await userManager.GetUserAsync(httpContext.User);

    if (user is null)
    {
        return Results.Unauthorized();
    }

    var now = DateTime.UtcNow;

    var trialDaysRemaining = Math.Max(
        0,
        (int)Math.Ceiling((user.TrialEndsAtUtc - now).TotalDays));

    var hasActiveAccess = user.Plan == SubscriptionPlan.Trial
        ? user.TrialEndsAtUtc > now
        : user.SubscriptionEndsAtUtc is null ||
          user.SubscriptionEndsAtUtc > now;

    return Results.Ok(new
    {
        user.Id,
        user.Email,
        user.FullName,
        plan = user.Plan.ToString(),
        user.TrialEndsAtUtc,
        user.SubscriptionEndsAtUtc,
        trialDaysRemaining,
        hasActiveAccess,
        user.PreferredLanguage,
        user.PreferredTheme
    });
})
.RequireAuthorization();

app.MapPost("/api/auth/logout", async (
    SignInManager<ApplicationUser> signInManager) =>
{
    await signInManager.SignOutAsync();
    return Results.NoContent();
})
.RequireAuthorization();

app.MapGet("/api/health", () =>
    Results.Ok(new
    {
        status = "healthy",
        application = "Ember API"
    }));

app.Run();
