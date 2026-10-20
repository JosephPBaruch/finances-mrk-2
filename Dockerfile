FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY FinanceApp.slnx global.json ./
COPY src/FinanceApp.Api/FinanceApp.Api.csproj src/FinanceApp.Api/
COPY tests/FinanceApp.Api.Tests/FinanceApp.Api.Tests.csproj tests/FinanceApp.Api.Tests/
RUN dotnet restore FinanceApp.slnx
COPY . .
RUN dotnet publish src/FinanceApp.Api/FinanceApp.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080 \
    ConnectionStrings__FinanceDatabase="Data Source=/data/finance.db"
EXPOSE 8080
COPY --from=build --chown=$APP_UID:$APP_UID /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "FinanceApp.Api.dll"]
