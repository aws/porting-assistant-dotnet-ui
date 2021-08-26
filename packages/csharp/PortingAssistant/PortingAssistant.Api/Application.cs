using Amazon;
using ElectronCgi.DotNet;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Model;
using PortingAssistant.Common.Model;
using PortingAssistant.Common.S3Upload;
using PortingAssistant.Common.Services;
using PortingAssistant.Common.Utils;
using PortingAssistant.VisualStudio;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using PortingAssistant.Client.NuGet.Interfaces;
using PortingAssistant.Telemetry.Utils;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;

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
                    var file1 = httpService.DownloadS3FileAsync("newtonsoft.json.json.gz");
                    file1.Wait();
                    var file2 = httpService.DownloadS3FileAsync("52projects.json.gz");
                    file2.Wait();
                    var file3 = httpService.DownloadS3FileAsync("2a486f72.mega.json.gz");
                    file3.Wait();
                    return true;
                }
                catch
                {
                    return false;
                }
            });

            _connection.On<CustomerFeedbackRequest, bool>("sendCustomerFeedback", request =>
            {
              string uniqueMachineID = LogUploadUtils.getUniqueIdentifier();
              request.keyname = uniqueMachineID + "/" + request.timestamp;
              RegionEndpoint bucketRegion = RegionEndpoint.USWest2;
              S3Upload upload = new S3Upload(
                  bucketRegion, 
                  "portingassistantcustomer-customerfeedbackbucketxx-1u90hz3i5ly3l",
                  request.accessKey,
                  request.secret
              );
            var contentObj = new Content
            {
                feedback = request.feedback,
                category = request.category,
                date = request.date,
                email = request.email,
                machineID = uniqueMachineID
            };
              string serializedContent = JsonConvert.SerializeObject(contentObj);  
                var uploadSuccess = upload.uploadObjWithString(request.keyname, serializedContent);
                return uploadSuccess;
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
