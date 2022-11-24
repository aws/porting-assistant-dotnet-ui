using ElectronCgi.DotNet;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Model;
using PortingAssistant.Client.NuGet.Interfaces;
using PortingAssistant.Common.Model;
using PortingAssistant.Common.Services;
using PortingAssistant.Common.Utils;
using PortingAssistant.Telemetry.Utils;
using PortingAssistant.VisualStudio;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using Newtonsoft.Json;
using System.Threading.Tasks;
using System.Linq;
using PortingAssistant.Client.Common.Model;
using System.IO;
using System.Net.Http;
using YamlDotNet.Core.Tokens;
using Amazon.S3;
using System.Drawing;
using Amazon;

namespace PortingAssistant.Api
{
    public class Application
    {
        private IServiceProvider _services { get; set; }
        private Connection _connection;
        private ILogger _logger;

        public Application(IServiceCollection serviceCollection)
        {
            _services = serviceCollection.BuildServiceProvider();
            _logger = _services.GetRequiredService<ILogger<Application>>();
            _connection = BuildConnection();
        }

        private Connection BuildConnection()
        {
            var serialiser = new PortingAssistantJsonSerializer();
            var channelMessageFactory = new ChannelMessageFactory(serialiser);
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            return new Connection(
                    new Channel(new TabSeparatedInputStreamParser(), serialiser),
                    new MessageDispatcher(),
                    new RequestExecutor(serialiser, channelMessageFactory),
                    new ResponseHandlerExecutor(serialiser),
                    new System.Threading.Tasks.Dataflow.BufferBlock<IChannelMessage>(),
                    channelMessageFactory)
            {
                LogFilePath = "electron-cgi.log",
                MinimumLogLevel = LogLevel.Warning,
                IsLoggingEnabled = false
            };
        }

        public void SetupConnection(bool console = false)
        {
            _connection.On<AnalyzeSolutionRequest, Response<SolutionDetails, string>>("analyzeSolution", request =>
            {
                var assessmentService = _services.GetRequiredService<IAssessmentService>();

                assessmentService.AddApiAnalysisListener((response) =>
                {
                    _connection.Send("onApiAnalysisUpdate", response);
                });

                assessmentService.AddNugetPackageListener((response) =>
                {
                    _connection.Send("onNugetPackageUpdate", response);
                });
                request.settings.UseGenerator = true;
                return assessmentService.AnalyzeSolution(request).Result;
            });


            _connection.On<CopyDirectoryRequest>("copyDirectory", request =>
             {
                 try
                 {
                     PortingAssistantUtils.CopyDirectory(request.solutionPath, request.destinationPath);
                 }
                 catch (Exception ex)
                 {
                     _logger.LogError(ex, "Failed to copy the solution to new location");
                     throw;
                 }

             });

            _connection.On<ProjectFilePortingRequest, Response<List<PortingResult>, List<PortingResult>>>("applyPortingProjectFileChanges", request =>
            {
                var portingService = _services.GetRequiredService<IPortingService>();

                return portingService.ApplyPortingChanges(request);
            });

            _connection.On<string, Response<bool, string>>("openSolutionInIDE", request =>
            {
                try
                {
                    var portingService = _services.GetRequiredService<IPortingService>();
                    var vsfinder = _services.GetRequiredService<IVisualStudioFinder>();
                    var vsPath = vsfinder.GetLatestVisualStudioPath();
                    var vsexe = PortingAssistantUtils.FindFiles(vsPath, "devenv.exe");

                    if (vsexe == null)
                    {
                        return new Response<bool, string>
                        {
                            Status = Response<bool, string>.Failed(new Exception("No Visual Studio")),
                            ErrorValue = "A valid installation of Visual Studio was not found"
                        };
                    }

                    Process.Start(vsexe, $"\"{request}\"");
                    return new Response<bool, string>
                    {
                        Status = Response<bool, string>.Success()
                    };
                }
                catch (Exception ex)
                {
                    return new Response<bool, string>
                    {
                        Status = Response<bool, string>.Failed(ex),
                        ErrorValue = ex.Message
                    };
                }
            });

            _connection.On<string, bool>("checkInternetAccess",
                request =>
                {
                    var httpService = _services.GetRequiredService<IHttpService>();
                    string[] files =
                    {
                        "newtonsoft.json.json.gz",
                        "github.json.gz",
                        "giger.json.gz",
                    };
                    return HttpServiceUtils.CheckInternetAccess(httpService, files);
                });

            _connection.On<string>("cancelAssessment",
              reuqest =>
              {
                  PortingAssistantUtils.cancel = true;
              });

            _connection.On<string, Response<List<SupportedVersion>, string>>("getSupportedVersion",
                request =>
                {
                    // Note that Console.WriteLine() would somehow messe up with the communication channel.
                    // The output message will be captured by the channel and fail the parsing,
                    // resulting to crash the return result of this request.
                    var defaultConfiguration = SupportedVersionConfiguration.GetDefaultConfiguration();
                    return new Response<List<SupportedVersion>, string>
                    {
                        Value = defaultConfiguration.Versions,
                        ErrorValue = string.Empty,
                        Status = Response<List<SupportedVersion>, string>.Success(),
                    };
                });
        }

        public void Start()
        {
            try
            {
                _connection.Listen();

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Connection ended");
            }
        }
    }
}
