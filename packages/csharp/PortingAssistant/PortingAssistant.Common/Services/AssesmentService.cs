using System;
using System.Collections.Generic;
using System.Linq;
using PortingAssistant.Common.Listener;
using PortingAssistant.Common.Model;
using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Client;
using PortingAssistant.Client.Model;

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
                var solutionAnalysisResult = _client.AnalyzeSolutionAsync(request.solutionFilePath, request.settings);
                solutionAnalysisResult.Wait();

                if (solutionAnalysisResult.IsCompletedSuccessfully)
                {
                    solutionAnalysisResult.Result.ProjectAnalysisResults.ForEach(projectAnalysResult =>
                    {
                        if (projectAnalysResult == null)
                        {
                            return;
                        }

                        projectAnalysResult.PackageAnalysisResults.ToList()
                        .ForEach(p =>
                        {
                            p.Value.ContinueWith(result =>
                            {
                                if (result.IsCompletedSuccessfully)
                                {
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

                        if (projectAnalysResult.IsBuildFailed)
                        {
                            _apiAnalysisListeners.ForEach(listener =>
                                listener.Invoke(new Response<ProjectApiAnalysisResult, SolutionProject>
                                {
                                    ErrorValue = new SolutionProject
                                    {
                                        ProjectPath = projectAnalysResult.ProjectFilePath,
                                        SolutionPath = request.solutionFilePath
                                    },
                                    Status = Response<ProjectApiAnalysisResult, SolutionProject>
                                    .Failed(new PortingAssistantClientException($"Errors during compilation in {projectAnalysResult.ProjectName}.", null))
                                }));

                            return;
                        }

                        _apiAnalysisListeners.ForEach(listener =>
                        {
                            listener.Invoke(new Response<ProjectApiAnalysisResult, SolutionProject>
                            {
                                Value = new ProjectApiAnalysisResult
                                {
                                    Errors = projectAnalysResult.Errors,
                                    SolutionFile = request.solutionFilePath,
                                    ProjectFile = projectAnalysResult.ProjectFilePath,
                                    SourceFileAnalysisResults = projectAnalysResult.SourceFileAnalysisResults
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
    }
}
