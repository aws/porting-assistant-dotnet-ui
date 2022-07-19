using System;
using System.Collections.Generic;
using System.Linq;
using PortingAssistant.Common.Listener;
using PortingAssistant.Common.Model;
using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Client;
using PortingAssistant.Client.Model;
using PortingAssistant.Common.Utils;
using System.Threading.Tasks;
using System.IO;
using System.Runtime;
using Newtonsoft.Json;

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

        public async Task<Response<SolutionDetails, string>> AnalyzeSolution(AnalyzeSolutionRequest request)
        {
            try
            {
                var startTime = DateTime.Now;
                string tgtFramework = request.settings.TargetFramework;

                // var solutionAnalysisResult = _client.AnalyzeSolutionAsync(request.solutionFilePath, request.settings);
                // solutionAnalysisResult.Wait();

                var preProjectTriggerDataDictionary = new Dictionary<string, PreTriggerData>();
                if (request.preTriggerData != null && request.preTriggerData.Length > 0)
                {
                    Array.ForEach(request.preTriggerData, prop => {
                        var proj = JsonConvert.DeserializeObject<PreTriggerData>(prop);
                        if (!preProjectTriggerDataDictionary.ContainsKey(proj.projectName))
                        {
                            preProjectTriggerDataDictionary.Add(proj.projectName, proj);
                        }
                    });
                }

                if (request.settings.UseGenerator)
                {
                    List<ProjectDetails> projectDetails = new List<ProjectDetails>();
                    var failedProjects = new List<string>();

                    var projectAnalysisResultEnumerator = _client.AnalyzeSolutionGeneratorAsync(request.solutionFilePath, request.settings).GetAsyncEnumerator();
                    try
                    {
                        while (await projectAnalysisResultEnumerator.MoveNextAsync().ConfigureAwait(false))
                        {
                            ProjectAnalysisResult result = projectAnalysisResultEnumerator.Current;
                            var preTriggerProjectData = preProjectTriggerDataDictionary.ContainsKey(result.ProjectName) ?
                                preProjectTriggerDataDictionary[result.ProjectName] : null;
                                TelemetryCollectionUtils.CollectProjectMetrics(result, request, tgtFramework, preTriggerProjectData);

                            projectDetails.Add(new ProjectDetails
                            {
                                PackageReferences = result.PackageReferences,
                                ProjectFilePath = result.ProjectFilePath,
                                ProjectGuid = result.ProjectGuid,
                                ProjectName = result.ProjectName,
                                ProjectReferences = result.ProjectReferences,
                                ProjectType = result.ProjectType,
                                TargetFrameworks = result.TargetFrameworks,
                                IsBuildFailed = result.IsBuildFailed
                            });

                            if (result.IsBuildFailed)
                            {
                                failedProjects.Add(result.ProjectFilePath);
                            }
                            ProjectAnalysisResultHandler(result, request, tgtFramework);

                            if (result != null)
                            {
                                result.Dispose();
                                GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;
                                GC.Collect();
                            }
                        }
                    }
                    finally
                    {
                        await projectAnalysisResultEnumerator.DisposeAsync();
                    }

                    var solutionDetails = new SolutionDetails
                    {
                        SolutionName = Path.GetFileNameWithoutExtension(request.solutionFilePath),
                        SolutionFilePath = request.solutionFilePath,
                        Projects = projectDetails,
                        FailedProjects = failedProjects
                    };
                    var SolutionAnalysisResult = new SolutionAnalysisResult()
                    {
                        SolutionDetails = solutionDetails
                    };
                    TelemetryCollectionUtils.CollectSolutionMetrics(SolutionAnalysisResult, request, startTime, tgtFramework);
                    return new Response<SolutionDetails, string>
                    {
                        Value = solutionDetails,
                        Status = Response<SolutionDetails, string>.Success()
                    };

                }
                else
                {
                    var solutionAnalysisResult = _client.AnalyzeSolutionAsync(request.solutionFilePath, request.settings);
                    solutionAnalysisResult.Wait();

                    if (solutionAnalysisResult.IsCompletedSuccessfully)
                    {
                        TelemetryCollectionUtils.CollectSolutionMetrics(solutionAnalysisResult.Result, request, startTime, tgtFramework);
                        solutionAnalysisResult.Result.ProjectAnalysisResults.ForEach(projectAnalysisResult =>
                        {
                            var preTriggerProjectData = preProjectTriggerDataDictionary.ContainsKey(projectAnalysisResult.ProjectName) ?
    preProjectTriggerDataDictionary[projectAnalysisResult.ProjectName] : null;
                            TelemetryCollectionUtils.CollectProjectMetrics(projectAnalysisResult, request, tgtFramework, preTriggerProjectData);

                            ProjectAnalysisResultHandler(projectAnalysisResult, request, tgtFramework);
                        });

                        solutionAnalysisResult.Result.FailedProjects.ForEach(projectFilePath =>
                        {
                            InvokeApiAnalysisListenerOnFailure(projectFilePath, projectFilePath, request.solutionFilePath);
                        });

                        return new Response<SolutionDetails, string>
                        {
                            Value = solutionAnalysisResult.Result.SolutionDetails,
                            Status = Response<SolutionDetails, string>.Success()
                        };
                    }
                    else
                    {
                        throw new PortingAssistantClientException($"analyze solution {request.solutionFilePath} failed", solutionAnalysisResult.Exception);
                    }

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

        public void ProjectAnalysisResultHandler(ProjectAnalysisResult projectAnalysisResult, AnalyzeSolutionRequest request, string tgtFramework)
        {
            if (projectAnalysisResult == null)
            {
                return;
            }
            TelemetryCollectionUtils.CollectProjectMetrics(projectAnalysisResult, request, tgtFramework);

            projectAnalysisResult.PackageAnalysisResults.ToList()
            .ForEach(p =>
            {
                p.Value.ContinueWith(result =>
                {
                    if (result.IsCompletedSuccessfully)
                    {
                        TelemetryCollectionUtils.CollectNugetMetrics(result, request, tgtFramework);

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

            if (projectAnalysisResult.SourceFileAnalysisResults != null &&
                projectAnalysisResult.ProjectGuid != null &&
                projectAnalysisResult.ProjectFilePath != null)
            {
                var selectedApis = projectAnalysisResult.SourceFileAnalysisResults.SelectMany(s => s.ApiAnalysisResults);
                var allActions = projectAnalysisResult.SourceFileAnalysisResults.SelectMany(a => a.RecommendedActions);
                allActions.ToList().ForEach(action =>
                {
                    var selectedApi = selectedApis.FirstOrDefault(s => s.CodeEntityDetails.TextSpan.Equals(action.TextSpan));
                    selectedApi?.Recommendations?.RecommendedActions?.Add(action);
                });
                TelemetryCollectionUtils.FileAssessmentCollect(selectedApis, request);
            }

            if (projectAnalysisResult.IsBuildFailed)
            {
                InvokeApiAnalysisListenerOnFailure(projectAnalysisResult.ProjectFilePath, projectAnalysisResult.ProjectName, request.solutionFilePath);
                return;
            }

            InvokeApiAnalysisListenerOnSuccess(projectAnalysisResult, request.solutionFilePath);

            return;
        }


        public void InvokeApiAnalysisListenerOnSuccess(ProjectAnalysisResult projectAnalysisResult, string solutionFilePath)
        {
            _apiAnalysisListeners.ForEach(listener =>
            {
                listener.Invoke(new Response<ProjectApiAnalysisResult, SolutionProject>
                {
                    Value = new ProjectApiAnalysisResult
                    {
                        Errors = projectAnalysisResult.Errors,
                        SolutionFile = solutionFilePath,
                        ProjectFile = projectAnalysisResult.ProjectFilePath,
                        ProjectGuid = projectAnalysisResult.ProjectGuid,
                        SourceFileAnalysisResults = projectAnalysisResult.SourceFileAnalysisResults
                    },
                    Status = Response<ProjectApiAnalysisResult, SolutionProject>.Success()
                });
            });
        }

        public void InvokeApiAnalysisListenerOnFailure(string ProjectFilePath, string ProjectName, string solutionFilePath)
        {
            _apiAnalysisListeners.ForEach(listener =>
                   listener.Invoke(new Response<ProjectApiAnalysisResult, SolutionProject>
                   {
                       ErrorValue = new SolutionProject
                       {
                           ProjectPath = ProjectFilePath,
                           SolutionPath = solutionFilePath
                       },
                       Status = Response<ProjectApiAnalysisResult, SolutionProject>
                                     .Failed(new PortingAssistantClientException($"Errors during compilation in {ProjectName}.", null))
                   }));

            return;
        }

        public void AddApiAnalysisListener(OnApiAnalysisUpdate listener)
        {
            _apiAnalysisListeners.Add(listener);
        }

        public void AddNugetPackageListener(OnNugetPackageUpdate listener)
        {
            _nugetPackageListeners.Add(listener);
        }
    }
}