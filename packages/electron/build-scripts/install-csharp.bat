rmdir /s/q netcore_build
mkdir netcore_build
dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Api\PortingAssistant.Api.csproj -c Release -f netcoreapp3.1 -o netcore_build
dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Telemetry\PortingAssistant.Telemetry.csproj -c Release -f netcoreapp3.1 -o netcore_build 
for /F delims^=^"^ tokens^=4 %%G in ('findstr "PortingAssistant.Client.Client"  ..\csharp\PortingAssistant\PortingAssistant.Api\PortingAssistant.Api.csproj') do @set "version=%%G"
set cliDownloadLink="https://s3.us-west-2.amazonaws.com/aws.portingassistant.dotnet.download/nuget/flatcontainer/portingassistant.client.cli/%version%/PortingAssistant.Client.CLI.exe"
curl %cliDownloadLink% --output netcore_build/PortingAssistant.Client.CLI.exe