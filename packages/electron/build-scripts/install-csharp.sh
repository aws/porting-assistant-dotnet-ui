#!/bin/bash -e
rm -rf ./netcore_build/
mkdir ./netcore_build/
(dotnet publish ../csharp/PortingAssistant/PortingAssistant.Api/PortingAssistant.Api.csproj -c Release -f netcoreapp3.1 -o ./netcore_build/)
(dotnet publish ../csharp/PortingAssistant/PortingAssistant.Telemetry/PortingAssistant.Telemetry.csproj -c Release -f netcoreapp3.1 -o ./netcore_build/)
version=$(grep 'PortingAssistant.Client.Client' ../csharp/PortingAssistant/PortingAssistant.Api/PortingAssistant.Api.csproj | sed 's/.*Version="\(.*\)".*/\1/')
cliDownloadLink="https://s3.us-west-2.amazonaws.com/aws.portingassistant.dotnet.download/nuget/flatcontainer/portingassistant.client.cli/${version}/PortingAssistant.Client.CLI.exe"
curl $cliDownloadLink -o ./netcore_build/PortingAssistant.Client.CLI.exe