using System;
using System.Collections.Generic;
using System.Linq;
using PortingAssistant.Common.Listener;
using PortingAssistant.Common.Model;
using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Client;
using PortingAssistant.Client.Client.FileParser;
using PortingAssistant.Client.Client.Utils;
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
                TelemetryCollectionUtils.CollectStartMetrics( request, startTime, tgtFramework);

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

                  List<ProjectDetails> projectDetails = new List<ProjectDetails>();
                  var failedProjects = new List<string>();
                  List<string> projectGuids = new List<string>();
                  
                  var projectAnalysisResultEnumerator = _client.AnalyzeSolutionGeneratorAsync(request.solutionFilePath, request.settings).GetAsyncEnumerator();
                  var projectStartTime = DateTime.Now;
                  var projectCount = 0;
                  var firstProjectTime = 0.0;
                  try
                  {
                      while (await projectAnalysisResultEnumerator.MoveNextAsync().ConfigureAwait(false) && !PortingAssistantUtils.cancel)
                      {
                          ProjectAnalysisResult result = projectAnalysisResultEnumerator.Current;
                          projectCount += 1;
                          var preTriggerProjectData = preProjectTriggerDataDictionary.ContainsKey(result.ProjectName) ?
                              preProjectTriggerDataDictionary[result.ProjectName] : null;
                            var projectAnalysisTime = DateTime.Now.Subtract(projectStartTime).TotalMilliseconds;
                            var cumulativeAnalysisTime = DateTime.Now.Subtract(startTime).TotalMilliseconds;
                              TelemetryCollectionUtils.CollectProjectMetrics(result, request, tgtFramework, projectAnalysisTime, cumulativeAnalysisTime, preTriggerProjectData);

                          if (projectCount == 1) {
                              firstProjectTime = cumulativeAnalysisTime;
                          }
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

                          projectGuids.Add(result.ProjectGuid);

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
                        projectStartTime = DateTime.Now;
                      }
                  }
                  finally
                  {
                      await projectAnalysisResultEnumerator.DisposeAsync();
                  }
                  var solutionGuid = SolutionFileParser.getSolutionGuid(request.solutionFilePath);
                  var solutionDetails = new SolutionDetails
                  {
                      SolutionName = Path.GetFileNameWithoutExtension(request.solutionFilePath),
                      SolutionFilePath = request.solutionFilePath,
                      Projects = projectDetails,
                      FailedProjects = failedProjects,
                      SolutionGuid = solutionGuid,
                      RepositoryUrl = GitConfigFileParser.getGitRepositoryRootPath(request.solutionFilePath),
                      ApplicationGuid = HashUtils.GenerateGuid(projectGuids)
                  };
                  var SolutionAnalysisResult = new SolutionAnalysisResult()
                  {
                      SolutionDetails = solutionDetails
                  };
                  TelemetryCollectionUtils.CollectSolutionMetrics(SolutionAnalysisResult, request, startTime, tgtFramework, firstProjectTime, projectCount, PortingAssistantUtils.cancel);
                  PortingAssistantUtils.cancel = false;
                  TelemetryCollectionUtils.CollectEndMetrics(request, startTime, tgtFramework);
                  return new Response<SolutionDetails, string>
                  {
                      Value = solutionDetails,
                      Status = Response<SolutionDetails, string>.Success()
                  };

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
                listener.Invoke(new Response<ProjectApiAnalysisResultExtended, SolutionProject>
                {
                    Value = new ProjectApiAnalysisResultExtended
                    {
                        Errors = projectAnalysisResult.Errors,
                        SolutionFile = solutionFilePath,
                        ProjectName = projectAnalysisResult.ProjectName,
                        ProjectFile = projectAnalysisResult.ProjectFilePath,
                        ProjectGuid = projectAnalysisResult.ProjectGuid,
                        ProjectType = projectAnalysisResult.ProjectType,
                        FeatureType = projectAnalysisResult.FeatureType,
                        TargetFrameworks = projectAnalysisResult.TargetFrameworks,
                        PacakgeReferences = projectAnalysisResult.PackageReferences.ToArray(),
                        ProjectReferences = projectAnalysisResult.ProjectReferences.ToArray(),
                        IsBuildFailed = projectAnalysisResult.IsBuildFailed,
                        SourceFileAnalysisResults = projectAnalysisResult.SourceFileAnalysisResults,
                    },
                    Status = Response<ProjectApiAnalysisResultExtended, SolutionProject>.Success()
                });
            });
        }

        public void InvokeApiAnalysisListenerOnFailure(string ProjectFilePath, string ProjectName, string solutionFilePath)
        {
            _apiAnalysisListeners.ForEach(listener =>
                   listener.Invoke(new Response<ProjectApiAnalysisResultExtended, SolutionProject>
                   {
                       ErrorValue = new SolutionProject
                       {
                           ProjectPath = ProjectFilePath,
                           SolutionPath = solutionFilePath
                       },
                       Status = Response<ProjectApiAnalysisResultExtended, SolutionProject>
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