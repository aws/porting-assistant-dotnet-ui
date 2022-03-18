rmdir /s/q netcore_build
mkdir netcore_build

:: Currently, our build environment downloads the .NET 6 runtime to ~\AppData\Local\Microsoft\dotnet.
:: When the .NET 6 runtime is included with the build environment by default, we can replace these commands
::  with the commented out commands below.
%userprofile%\AppData\Local\Microsoft\dotnet\dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Api\PortingAssistant.Api.csproj -c Release -f net6.0 -o netcore_build
%userprofile%\AppData\Local\Microsoft\dotnet\dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Telemetry\PortingAssistant.Telemetry.csproj -c Release -f net6.0 -o netcore_build 

::dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Api\PortingAssistant.Api.csproj -c Release -f net6.0 -o netcore_build
::dotnet publish ..\csharp\PortingAssistant\PortingAssistant.Telemetry\PortingAssistant.Telemetry.csproj -c Release -f net6.0 -o netcore_build 