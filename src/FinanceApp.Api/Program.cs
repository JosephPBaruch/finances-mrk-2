using System.Reflection;
using FinanceApp.Api.Configuration;
using FinanceApp.Api.Data;
using FinanceApp.Api.Middleware;
using FinanceApp.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

// This project uses C# "top-level statements." Because it is a Web SDK project,
// the compiler turns the statements in this file into the application's generated
// Program.Main entry point. Nothing has to call Program.cs explicitly.
//
// CreateBuilder prepares the web host and combines configuration from sources such
// as appsettings.json, environment variables, command-line arguments, and (during
// local development) user secrets. It also creates the dependency-injection service
// collection exposed by builder.Services.
var builder = WebApplication.CreateBuilder(args);

// builder.Services is a list of instructions for creating application dependencies.
// Calling Build() later turns these registrations into the service provider that
// supplies constructor arguments to controllers and services automatically.
builder.Services.AddProblemDetails();
builder.Services.AddControllers();

// Bind the "Plaid" and "Encryption" configuration sections to typed options classes.
// IOptions<PlaidOptions> can then be constructor-injected wherever it is needed.
builder.Services.AddOptions<PlaidOptions>()
    .Bind(builder.Configuration.GetSection(PlaidOptions.SectionName))
    .ValidateDataAnnotations();
builder.Services.Configure<EncryptionOptions>(builder.Configuration.GetSection(EncryptionOptions.SectionName));

var connectionString = builder.Configuration.GetConnectionString("FinanceDatabase")
    ?? throw new InvalidOperationException("ConnectionStrings:FinanceDatabase is required.");

// AddDbContext registers one FinanceDbContext per dependency-injection scope. For
// normal web traffic, a scope lasts for one HTTP request.
builder.Services.AddDbContext<FinanceDbContext>(options => options.UseSqlite(connectionString));

// Register a typed HttpClient. When a class asks for IPlaidService, the container
// creates PlaidService with an HttpClient configured here. IHttpClientFactory pools
// the underlying network handlers so the app does not manage sockets manually.
builder.Services.AddHttpClient<IPlaidService, PlaidService>((services, client) =>
{
    var options = services.GetRequiredService<Microsoft.Extensions.Options.IOptions<PlaidOptions>>().Value;
    client.BaseAddress = options.BaseUri;
    client.Timeout = TimeSpan.FromSeconds(60);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("FinanceApp/1.0");
});

// These are scoped registrations, not singletons. Each HTTP request receives one
// instance of each service, and services resolved during that request can safely
// share its scoped FinanceDbContext.
builder.Services.AddScoped<IEncryptionService, AesGcmEncryptionService>();
builder.Services.AddScoped<ICurrentUserService, DevelopmentCurrentUserService>();
builder.Services.AddScoped<IBankConnectionService, BankConnectionService>();
builder.Services.AddScoped<ITransactionSyncService, TransactionSyncService>();

// Register services that generate the OpenAPI document and Swagger UI.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Finance App API",
        Version = "v1",
        Description = "Phase 1 personal-finance backend with Plaid Sandbox integration."
    });
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) options.IncludeXmlComments(xmlPath);
});

// Build finalizes the dependency-injection container and creates the application.
var app = builder.Build();

// Everything below configures the HTTP request pipeline. Requests pass through the
// exception middleware first, then are routed to the matching controller action.
app.UseMiddleware<ExceptionHandlingMiddleware>();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Finance App API v1");
        options.RoutePrefix = "swagger";
    });
}

app.MapControllers();

// Startup code is not running inside an HTTP request, so create a temporary scope
// before resolving the scoped FinanceDbContext. Apply pending EF Core migrations
// before the server begins accepting requests.
await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
    var dataSource = dbContext.Database.GetDbConnection().DataSource;
    var databaseDirectory = Path.GetDirectoryName(Path.GetFullPath(dataSource));
    if (!string.IsNullOrEmpty(databaseDirectory)) Directory.CreateDirectory(databaseDirectory);
    await dbContext.Database.MigrateAsync();
}

// Start the web server and keep the process alive until it is shut down.
await app.RunAsync();

// Top-level statements generate a Program class automatically. Declaring another
// partial piece makes that generated class accessible to integration-test tooling.
public partial class Program;
