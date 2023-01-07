rmdir /s/q netcore_build
mkdir netcore_build

dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Api\PortingAssistant.Api.csproj -c Debug -f net6.0 -o netcore_build
dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Telemetry\PortingAssistant.Telemetry.csproj -c Debug -f net6.0 -o netcore_build 