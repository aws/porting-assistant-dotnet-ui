rmdir /s/q netcore_build
mkdir netcore_build
dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Api\PortingAssistant.Api.csproj -c Release -f netcoreapp3.1 -o netcore_build
dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Telemetry\PortingAssistant.Telemetry.csproj -c Release -f netcoreapp3.1 -o netcore_build