using System;
using System.Collections.Generic;
using System.Diagnostics;
using ElectronCgi.DotNet;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using PortingAssistant.Client.Model;
using PortingAssistant.Client.NuGet.Interfaces;
using PortingAssistant.Common.Model;
using PortingAssistant.Common.Services;
using PortingAssistant.Common.Utils;
using PortingAssistant.VisualStudio;
using Serilog.Context;

namespace PortingAssistant.Api
{
    public class Application
    {
        private readonly ServiceProvider _services;
        private readonly Connection _connection;
        private readonly ILogger _logger;

        public Application(IServiceCollection serviceCollection)
        {
            _services = serviceCollection.BuildServiceProvider();
            _logger = _services.GetRequiredService<ILogger<Application>>();
            _connection = BuildConnection();
        }

        private Connection BuildConnection()
        {
            _logger.LogInformation(nameof(BuildConnection));

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
                var logContext = CreateLogContextJson(request);
                using var _ =  LogContext.PushProperty("context", logContext);

                try
                {
                    _logger.LogInformation($"Begin On{nameof(AnalyzeSolutionRequest)}");

                    var assessmentService = _services.GetRequiredService<IAssessmentService>();

                    assessmentService.AddApiAnalysisListener((response) => { _connection.Send("onApiAnalysisUpdate", response); });

                    assessmentService.AddNugetPackageListener((response) => { _connection.Send("onNugetPackageUpdate", response); });
                    request.settings.UseGenerator = true;
                    return assessmentService.AnalyzeSolution(request).Result;
                }
                finally
                {
                    _logger.LogInformation($"End On{nameof(AnalyzeSolutionRequest)}");
                }
            });


            _connection.On<CopyDirectoryRequest, Response<bool, string>>("copyDirectory", request =>
            {
                var logContext = CreateLogContextJson(request);
                using var _ = LogContext.PushProperty("context", logContext);

                try
                {
                    _logger.LogInformation($"Begin On{nameof(CopyDirectoryRequest)}");

                    PortingAssistantUtils.CopyDirectory(request.solutionPath, request.destinationPath);
                    return new Response<bool, string>
                    {
                        Status = Response<bool, string>.Success()
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to copy the solution to new location" + logContext);
                    return new Response<bool, string>
                    {
                        Status = Response<bool, string>.Failed(ex),
                        ErrorValue = ex.Message
                    };
                }
                finally
                {
                    _logger.LogInformation($"End On{nameof(CopyDirectoryRequest)}");
                }

            });

            _connection.On<ProjectFilePortingRequest, Response<List<PortingResult>, List<PortingResult>>>("applyPortingProjectFileChanges", request =>
            {
                var logContext = CreateLogContextJson(request);
                using var _ = LogContext.PushProperty("context", logContext);

                try
                {
                    _logger.LogInformation($"Begin On{nameof(ProjectFilePortingRequest)}");

                    var portingService = _services.GetRequiredService<IPortingService>();

                    return portingService.ApplyPortingChanges(request);
                }
                finally
                {
                    _logger.LogInformation($"End On{nameof(ProjectFilePortingRequest)}");
                }
            });

            _connection.On<string, Response<bool, string>>("openSolutionInIDE", request =>
            {
                var logContext = CreateLogContextJson(request);
                using var _ = LogContext.PushProperty("context", logContext);
                
                try
                {
                    _logger.LogInformation("Begin OnOpenSolutionInIDE");

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
                finally
                {
                    _logger.LogInformation("End OnOpenSolutionInIDE");
                }
            });

            _connection.On<string, bool>("checkInternetAccess", _ =>
            {
                var logContext = CreateLogContextJson("<empty payload>");
                using var __ = LogContext.PushProperty("context", logContext);

                try
                {
                    _logger.LogInformation("Begin OnCheckInternetAccess");

                    var httpService = _services.GetRequiredService<IHttpService>();
                    string[] files =
                    {
                        "newtonsoft.json.json.gz",
                        "github.json.gz",
                        "giger.json.gz",
                    };
                    return HttpServiceUtils.CheckInternetAccess(httpService, files);
                }
                finally
                {
                    _logger.LogInformation("End OnCheckInternetAccess");
                }
            });

            _connection.On<string>("cancelAssessment", _ =>
            {
                var logContext = CreateLogContextJson("<empty payload>");
                using var __ = LogContext.PushProperty("context", logContext);

                try
                {
                    _logger.LogInformation("Begin OnCancelAssessment");

                    PortingAssistantUtils.cancel = true;
                }
                finally
                {
                    _logger.LogInformation("End OnCancelAssessment");
                }
            });

            _connection.On<string, Response<List<SupportedVersion>, string>>("getSupportedVersion", _ =>
            {
                var logContext = CreateLogContextJson("<empty payload>");
                using var __ = LogContext.PushProperty("context", logContext);

                try
                {
                    _logger.LogInformation("Begin OnGetSupportedVersion");

                    // Note that Console.WriteLine() would somehow mess up with the communication channel.
                    // The output message will be captured by the channel and fail the parsing,
                    // resulting to crash the return result of this request.
                    var defaultConfiguration = SupportedVersionConfiguration.GetDefaultConfiguration();
                    return new Response<List<SupportedVersion>, string>
                    {
                        Value = defaultConfiguration.Versions,
                        ErrorValue = string.Empty,
                        Status = Response<List<SupportedVersion>, string>.Success(),
                    };
                }
                finally
                {
                    _logger.LogInformation("End OnGetSupportedVersion");
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

        private string CreateLogContextJson(object request)
        {
            try
            {
                return
                    Environment.NewLine +
                    JsonConvert.SerializeObject(
                        new
                        {
                            RequestPayload = request,
                            RequestType = request.GetType().Name,
                            TraceId = Guid.NewGuid(),
                            TimeStamp = DateTime.UtcNow.ToString("u")
                        },
                        Formatting.Indented);
            }
            catch (Exception e)
            {
                return Environment.NewLine +
                       $"Exception building log context: {e.Message}";
            }
        }
    }
}
