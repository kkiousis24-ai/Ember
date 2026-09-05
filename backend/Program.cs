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
app.UseAuthorization();

app.MapControllers();

app.MapGroup("/api/auth")
    .MapIdentityApi<ApplicationUser>();

app.MapGet("/api/health", () =>
    Results.Ok(new
    {
        status = "healthy",
        application = "Ember API"
    }));

app.Run();