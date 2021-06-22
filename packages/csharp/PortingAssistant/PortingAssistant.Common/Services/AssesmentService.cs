using System;
using System.Collections.Generic;
using System.Linq;
using PortingAssistant.Common.Listener;
using PortingAssistant.Common.Model;
using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Client;
using PortingAssistant.Client.Model;
using PortingAssistant.Telemetry;
using PortingAssistant.Telemetry.Model;
using System.Web.Helpers;

namespace PortingAssistant.Common.Services
{
    public class AssessmentService : IAssessmentService
    {

        private readonly ILogger _logger;
        private readonly IPortingAssistantClient _client;
        private readonly List<OnApiAnalysisUpdate> _apiAnalysisListeners;
        private readonly List<OnNugetPackageUpdate> _nugetPackageListeners;

        public AssessmentService(ILogger<AssessmentService> logger,
            IPortingAssistantClient client)
        {
            _logger = logger;
            _client = client;
            _apiAnalysisListeners = new List<OnApiAnalysisUpdate>();
            _nugetPackageListeners = new List<OnNugetPackageUpdate>();
        }

        public Response<SolutionDetails, string> AnalyzeSolution(AnalyzeSolutionRequest request)
        {
            try
            {
                var startTime = DateTime.Now;
                string tgtFramework = request.settings.TargetFramework;

                var solutionAnalysisResult = _client.AnalyzeSolutionAsync(request.solutionFilePath, request.settings);
                solutionAnalysisResult.Wait();

                if (solutionAnalysisResult.IsCompletedSuccessfully)
                {
                    var date = DateTime.Now;
                    string solutionPath = request.solutionFilePath;
                    if (solutionPath == null) solutionPath = "";
                    var solutionMetrics = new SolutionMetrics{
                      MetricsType = MetricsType.solution,
                      TargetFramework = tgtFramework,
                      TimeStamp = date.ToString("MM/dd/yyyy HH:mm"),
                      SolutionPath = Crypto.SHA256(solutionPath),
                      AnalysisTime = DateTime.Now.Subtract(startTime).TotalMilliseconds
                    };
                    TelemetryCollector.Collect<SolutionMetrics>(solutionMetrics);

                    solutionAnalysisResult.Result.ProjectAnalysisResults.ForEach(projectAnalysisResult =>
                    {
                        if (projectAnalysisResult == null)
                        {
                            return;
                        }

                        var projectMetrics = new ProjectMetrics{
                            MetricsType = MetricsType.project,
                            TargetFramework = tgtFramework,
                            sourceFrameworks = projectAnalysisResult.TargetFrameworks,
                            TimeStamp = date.ToString("MM/dd/yyyy HH:mm"),
                            projectGuid = Crypto.SHA256(projectAnalysisResult.ProjectGuid),
                            projectType = projectAnalysisResult.ProjectType,
                            numNugets = projectAnalysisResult.PackageReferences.Count,
                            numReferences = projectAnalysisResult.ProjectReferences.Count,
                            isBuildFailed = projectAnalysisResult.IsBuildFailed,
                        };
                        TelemetryCollector.Collect<ProjectMetrics>(projectMetrics);

                        projectAnalysisResult.PackageAnalysisResults.ToList()
                        .ForEach(p =>
                        {
                            p.Value.ContinueWith(result =>
                            {
                                if (result.IsCompletedSuccessfully)
                                {
                                    var nugetMetrics = new NugetMetrics
                                    {
                                        MetricsType = MetricsType.nuget,
                                        TargetFramework = tgtFramework,
                                        TimeStamp = date.ToString("MM/dd/yyyy HH:mm"),
                                        pacakgeName = result.Result.PackageVersionPair.PackageId,
                                        packageVersion = result.Result.PackageVersionPair.Version,
                                        compatibility = result.Result.CompatibilityResults[tgtFramework].Compatibility
                                    };
                                    TelemetryCollector.Collect<NugetMetrics>(nugetMetrics);

                                    _nugetPackageListeners.ForEach(l => l.Invoke(new Response<PackageAnalysisResult, PackageVersionPair>
                                    {
                                        Value = result.Result,
                                        Status = Response<PackageAnalysisResult, PackageVersionPair>.Success()
                                    }));
                                    return;
                                }

                                _nugetPackageListeners.ForEach(l => l.Invoke(new Response<PackageAnalysisResult, PackageVersionPair>
                                {
                                    ErrorValue = p.Key,
                                    Status = Response<PackageAnalysisResult, PackageVersionPair>.Failed(result.Exception)
                                }));
                            });
                        });

                        projectAnalysisResult.SourceFileAnalysisResults.ToList().ForEach(
                          sourceFile => {
                            FileAssessmentCollect(sourceFile, request.settings.TargetFramework);
                          } 
                        );

                        if (projectAnalysisResult.IsBuildFailed)
                        {
                            _apiAnalysisListeners.ForEach(listener =>
                                listener.Invoke(new Response<ProjectApiAnalysisResult, SolutionProject>
                                {
                                    ErrorValue = new SolutionProject
                                    {
                                        ProjectPath = projectAnalysisResult.ProjectFilePath,
                                        SolutionPath = request.solutionFilePath
                                    },
                                    Status = Response<ProjectApiAnalysisResult, SolutionProject>
                                    .Failed(new PortingAssistantClientException($"Errors during compilation in {projectAnalysisResult.ProjectName}.", null))
                                }));

                            return;
                        }

                        _apiAnalysisListeners.ForEach(listener =>
                        {
                            listener.Invoke(new Response<ProjectApiAnalysisResult, SolutionProject>
                            {
                                Value = new ProjectApiAnalysisResult
                                {
                                    Errors = projectAnalysisResult.Errors,
                                    SolutionFile = request.solutionFilePath,
                                    ProjectFile = projectAnalysisResult.ProjectFilePath,
                                    ProjectGuid = projectAnalysisResult.ProjectGuid,
                                    SourceFileAnalysisResults = projectAnalysisResult.SourceFileAnalysisResults
                                },
                                Status = Response<ProjectApiAnalysisResult, SolutionProject>.Success()
                            });
                        });

                        return;
                    });

                    solutionAnalysisResult.Result.FailedProjects.ForEach(projectFilePath =>
                    {
                        _apiAnalysisListeners.ForEach(listener =>
                            listener.Invoke(new Response<ProjectApiAnalysisResult, SolutionProject>
                            {
                                ErrorValue = new SolutionProject
                                {
                                    ProjectPath = projectFilePath,
                                    SolutionPath = request.solutionFilePath
                                },
                                Status = Response<ProjectApiAnalysisResult, SolutionProject>
                                .Failed(new PortingAssistantClientException($"Errors during compilation in {projectFilePath}.", null))
                            }));
                    });

                    return new Response<SolutionDetails, string>
                    {
                        Value = solutionAnalysisResult.Result.SolutionDetails,
                        Status = Response<SolutionDetails, string>.Success()
                    };
                }
                else
                {
                    throw new PortingAssistantClientException($"anaylze solution {request.solutionFilePath} failed", solutionAnalysisResult.Exception);
                }
            }
            catch (Exception ex)
            {
                return new Response<SolutionDetails, string>
                {
                    ErrorValue = request.solutionFilePath,
                    Status = Response<SolutionDetails, string>.Failed(ex)
                };

            }
        }

        public void AddApiAnalysisListener(OnApiAnalysisUpdate listener)
        {
            _apiAnalysisListeners.Add(listener);
        }

        public void AddNugetPackageListener(OnNugetPackageUpdate listener)
        {
            _nugetPackageListeners.Add(listener);
        }

        public static void FileAssessmentCollect(SourceFileAnalysisResult result, string targetFramework)
        {
            var date = DateTime.Now;
            foreach (var api in result.ApiAnalysisResults)
            {
                var apiMetrics = new APIMetrics
                {
                    MetricsType = MetricsType.api,
                    TargetFramework = targetFramework,
                    TimeStamp = date.ToString("MM/dd/yyyy HH:mm"),
                    name = api.CodeEntityDetails.Name,
                    nameSpace = api.CodeEntityDetails.Namespace,
                    originalDefinition = api.CodeEntityDetails.OriginalDefinition,
                    compatibility = api.CompatibilityResults[targetFramework].Compatibility,
                    packageId = api.CodeEntityDetails.Package.PackageId,
                    packageVersion = api.CodeEntityDetails.Package.Version
                };
                TelemetryCollector.Collect<APIMetrics>(apiMetrics);
            }
        }
    }
}

