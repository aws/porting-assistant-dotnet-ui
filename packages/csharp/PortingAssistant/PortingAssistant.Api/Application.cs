using System;
using System.IO;
using System.Collections.Generic;
using ElectronCgi.DotNet;
using PortingAssistant.Common.Model;
using PortingAssistant.Common.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Model;
using System.Diagnostics;
using PortingAssistant.Common.Utils;
using PortingAssistant.VisualStudio;
using PortingAssistant.Client.NuGet.Interfaces;

namespace PortingAssistant.Api
{
    public class Application
    {
        private IServiceProvider _services { get; set; }
        private Connection _connection;
        private ILogger _logger;

        public Application(IServiceCollection serviceCollection, PortingAssistantSink portingAssistantSink)
        {
            _services = serviceCollection.BuildServiceProvider();
            _logger = _services.GetRequiredService<ILogger<Application>>();
            _connection = BuildConnection();
            portingAssistantSink.registerOnData((response) =>
            {
                _connection.Send("onDataUpdate", response);
            });


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

                return assessmentService.AnalyzeSolution(request);
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

                    Process.Start(vsexe, request);
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

            _connection.On<string, bool>("checkInternetAccess", request =>
            {
                var httpService = _services.GetRequiredService<IHttpService>();
                try
                {
                    var fileToDownload = "newtonsoft.json.json.gz";
                    using Stream stream = httpService.DownloadS3FileAsync(fileToDownload).Result;
                    return true;
                }
                catch
                {
                    return false;
                }
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
