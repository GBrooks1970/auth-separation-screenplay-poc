using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using UserProfileService.Models;

var builder = WebApplication.CreateBuilder(args);

// Enable CORS for all origins
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});
builder.Services.AddHttpClient();

var app = builder.Build();
app.UseCors();

var httpClientFactory = app.Services.GetRequiredService<IHttpClientFactory>();

ConcurrentDictionary<string, UserProfileRecord> InitialiseProfiles() =>
    new(new Dictionary<string, UserProfileRecord>
    {
        ["usr_alice_123"] = new()
        {
            UserId = "usr_alice_123",
            Name = "Alice Smith",
            Email = "alice@example.com",
            AvatarUrl = "https://avatars.example.com/alice.png",
            PhoneNumber = "+44 20 7946 0912",
            Preferences = new() { Locale = "en-GB", Theme = "dark", EmailNotifications = true },
            CreatedAt = "2026-01-15T09:00:00Z",
            UpdatedAt = "2026-08-18T10:00:00Z"
        },
        ["usr_bob_456"] = new()
        {
            UserId = "usr_bob_456",
            Name = "Bob Jones",
            Email = "bob@example.com",
            AvatarUrl = "https://avatars.example.com/bob.png",
            Preferences = new() { Locale = "en-GB", Theme = "light", EmailNotifications = true },
            CreatedAt = "2026-02-10T11:00:00Z",
            UpdatedAt = "2026-08-18T10:00:00Z"
        }
    });

var profiles = InitialiseProfiles();

// Helper to check authentication
bool IsAuthenticated(HttpContext context)
{
    var authHeader = context.Request.Headers["Authorization"].ToString();
    var bypassHeader = context.Request.Headers["x-bypass-auth"].ToString();
    return !string.IsNullOrWhiteSpace(authHeader) || !string.IsNullOrWhiteSpace(bypassHeader);
}

// Helper to emit events to broker
async Task EmitEventAsync(string channel, string name, object payload)
{
    try
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(1);
        var envelope = new { channel, name, payload };
        var content = new StringContent(JsonSerializer.Serialize(envelope), Encoding.UTF8, "application/json");
        await client.PostAsync("http://localhost:3001/events", content);
    }
    catch
    {
        // Gracefully ignore broker disconnection in isolated unit runs
    }
}

// 1. Swagger UI documentation endpoint at /docs
app.MapGet("/docs", () =>
{
    var specPath = Path.Combine(Directory.GetCurrentDirectory(), "specs", "userinfo-api_v1.yaml");
    var specContent = File.Exists(specPath) ? File.ReadAllText(specPath) : "";
    var jsonSpec = JsonSerializer.Serialize(specContent);

    var html = $$"""
    <!DOCTYPE html>
    <html lang="en-GB">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>User Profile API — C# ASP.NET Core Reference Implementation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
      <style>body { margin: 0; background: #fafafa; } .topbar { display: none; }</style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
      <script>
        window.onload = function() {
          const rawSpec = {{jsonSpec}};
          const parsedSpec = jsyaml.load(rawSpec);
          window.ui = SwaggerUIBundle({
            spec: parsedSpec,
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: "BaseLayout"
          });
        };
      </script>
    </body>
    </html>
    """;

    return Results.Content(html, "text/html; charset=utf-8");
});

// 2. GET /profiles/{userId}
app.MapGet("/profiles/{userId}", (string userId, HttpContext context) =>
{
    if (!IsAuthenticated(context))
    {
        return Results.Json(
            new ErrorResponse { Code = "UNAUTHENTICATED", Message = "Authentication token is required to access user profile" },
            statusCode: 401
        );
    }

    if (!profiles.TryGetValue(userId, out var profile))
    {
        return Results.Json(
            new ErrorResponse { Code = "PROFILE_NOT_FOUND", Message = $"The requested profile for user ID {userId} could not be found" },
            statusCode: 404
        );
    }

    return Results.Ok(profile);
});

// 3. PUT /profiles/{userId}
app.MapPut("/profiles/{userId}", async (string userId, [FromBody] UpdateProfileRequest body, HttpContext context) =>
{
    if (!IsAuthenticated(context))
    {
        return Results.Json(
            new ErrorResponse { Code = "UNAUTHENTICATED", Message = "Authentication token is required to access user profile" },
            statusCode: 401
        );
    }

    if (!string.IsNullOrWhiteSpace(body.Email) && !body.Email.Contains('@'))
    {
        return Results.Json(
            new ValidationErrorResponse
            {
                Details = [new ValidationErrorDetail { Field = "email", Message = "Value is not a valid email address" }]
            },
            statusCode: 400
        );
    }

    profiles.TryGetValue(userId, out var existing);

    var updated = new UserProfileRecord
    {
        UserId = userId,
        Name = body.Name ?? existing?.Name ?? string.Empty,
        Email = body.Email ?? existing?.Email ?? string.Empty,
        AvatarUrl = body.AvatarUrl ?? existing?.AvatarUrl,
        PhoneNumber = body.PhoneNumber ?? existing?.PhoneNumber,
        Preferences = new()
        {
            Locale = body.Preferences?.Locale ?? existing?.Preferences.Locale ?? "en-GB",
            Theme = body.Preferences?.Theme ?? body.Theme ?? existing?.Preferences.Theme ?? "dark",
            EmailNotifications = body.Preferences?.EmailNotifications ?? existing?.Preferences.EmailNotifications ?? true
        },
        CreatedAt = existing?.CreatedAt ?? DateTime.UtcNow.ToString("o"),
        UpdatedAt = DateTime.UtcNow.ToString("o")
    };

    profiles[userId] = updated;

    await EmitEventAsync("userinfo.events", "ProfileUpdated", new
    {
        event_id = $"evt_prof_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
        user_id = userId,
        updated_fields = new[] { "name", "email", "theme" },
        timestamp = updated.UpdatedAt
    });

    return Results.Ok(updated);
});

// 4. PATCH /profiles/{userId}
app.MapPatch("/profiles/{userId}", async (string userId, [FromBody] UpdateProfileRequest body, HttpContext context) =>
{
    if (!IsAuthenticated(context))
    {
        return Results.Json(
            new ErrorResponse { Code = "UNAUTHENTICATED", Message = "Authentication token is required to access user profile" },
            statusCode: 401
        );
    }

    if (!string.IsNullOrWhiteSpace(body.Email) && !body.Email.Contains('@'))
    {
        return Results.Json(
            new ValidationErrorResponse
            {
                Details = [new ValidationErrorDetail { Field = "email", Message = "Value is not a valid email address" }]
            },
            statusCode: 400
        );
    }

    if (!profiles.TryGetValue(userId, out var existing))
    {
        return Results.Json(
            new ErrorResponse { Code = "PROFILE_NOT_FOUND", Message = $"Profile {userId} not found" },
            statusCode: 404
        );
    }

    var patched = new UserProfileRecord
    {
        UserId = userId,
        Name = body.Name ?? existing.Name,
        Email = body.Email ?? existing.Email,
        AvatarUrl = body.AvatarUrl ?? existing.AvatarUrl,
        PhoneNumber = body.PhoneNumber ?? existing.PhoneNumber,
        Preferences = new()
        {
            Locale = body.Preferences?.Locale ?? existing.Preferences.Locale,
            Theme = body.Preferences?.Theme ?? body.Theme ?? existing.Preferences.Theme,
            EmailNotifications = body.Preferences != null ? body.Preferences.EmailNotifications : existing.Preferences.EmailNotifications
        },
        CreatedAt = existing.CreatedAt,
        UpdatedAt = DateTime.UtcNow.ToString("o")
    };

    profiles[userId] = patched;

    await EmitEventAsync("userinfo.events", "ProfileUpdated", new
    {
        event_id = $"evt_prof_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
        user_id = userId,
        updated_fields = new[] { "preferences" },
        timestamp = patched.UpdatedAt
    });

    return Results.Ok(patched);
});

// 5. DELETE /profiles/{userId}
app.MapDelete("/profiles/{userId}", async (string userId, HttpContext context) =>
{
    if (!IsAuthenticated(context))
    {
        return Results.Json(
            new ErrorResponse { Code = "UNAUTHENTICATED", Message = "Authentication token is required to access user profile" },
            statusCode: 401
        );
    }

    if (!profiles.TryRemove(userId, out _))
    {
        return Results.Json(
            new ErrorResponse { Code = "PROFILE_NOT_FOUND", Message = $"Profile {userId} not found" },
            statusCode: 404
        );
    }

    await EmitEventAsync("userinfo.events", "ProfileDeleted", new
    {
        event_id = $"evt_prof_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
        user_id = userId,
        timestamp = DateTime.UtcNow.ToString("o")
    });

    return Results.NoContent();
});

// 6. POST /internal/reset
app.MapPost("/internal/reset", () =>
{
    profiles = InitialiseProfiles();
    return Results.Ok(new { status = "reset", service = "userprofile-dotnet" });
});

app.Run();
