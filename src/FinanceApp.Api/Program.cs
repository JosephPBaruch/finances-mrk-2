using System.Reflection;
using FinanceApp.Api.Configuration;
using FinanceApp.Api.Data;
using FinanceApp.Api.Middleware;
using FinanceApp.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddControllers();
builder.Services.AddOptions<PlaidOptions>()
    .Bind(builder.Configuration.GetSection(PlaidOptions.SectionName))
    .ValidateDataAnnotations();
builder.Services.Configure<EncryptionOptions>(builder.Configuration.GetSection(EncryptionOptions.SectionName));

var connectionString = builder.Configuration.GetConnectionString("FinanceDatabase")
    ?? throw new InvalidOperationException("ConnectionStrings:FinanceDatabase is required.");
builder.Services.AddDbContext<FinanceDbContext>(options => options.UseSqlite(connectionString));

builder.Services.AddHttpClient<IPlaidService, PlaidService>((services, client) =>
{
    var options = services.GetRequiredService<Microsoft.Extensions.Options.IOptions<PlaidOptions>>().Value;
    client.BaseAddress = options.BaseUri;
    client.Timeout = TimeSpan.FromSeconds(60);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("FinanceApp/1.0");
});
builder.Services.AddScoped<IEncryptionService, AesGcmEncryptionService>();
builder.Services.AddScoped<ICurrentUserService, DevelopmentCurrentUserService>();
builder.Services.AddScoped<IBankConnectionService, BankConnectionService>();
builder.Services.AddScoped<ITransactionSyncService, TransactionSyncService>();

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

var app = builder.Build();

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

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
    var dataSource = dbContext.Database.GetDbConnection().DataSource;
    var databaseDirectory = Path.GetDirectoryName(Path.GetFullPath(dataSource));
    if (!string.IsNullOrEmpty(databaseDirectory)) Directory.CreateDirectory(databaseDirectory);
    await dbContext.Database.MigrateAsync();
}

await app.RunAsync();

public partial class Program;
