using System.Threading.Tasks;
using PortingAssistant.Client.Model;
using System;
using PortingAssistant.Common.Model;
using PortingAssistant.Telemetry.Model;
using System.Web.Helpers;
using PortingAssistantExtensionTelemetry;
using System.Linq;
using System.Collections.Generic;

namespace PortingAssistant.Common.Utils
{
    public static class TelemetryCollectionUtils
    {
      public static void CollectSolutionMetrics(Task<SolutionAnalysisResult> solutionAnalysisResult, AnalyzeSolutionRequest request, DateTime startTime, string tgtFramework) {
        string solutionPath = request.solutionFilePath;
        if (solutionPath == null) solutionPath = "";
        var solutionMetrics = new SolutionMetrics{
          MetricsType = MetricsType.Solution,
          TargetFramework = tgtFramework,
          TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
          SolutionPath = Crypto.SHA256(solutionPath),
          AnalysisTime = DateTime.Now.Subtract(startTime).TotalMilliseconds
        };
        TelemetryCollector.Collect<SolutionMetrics>(solutionMetrics);
      }

      public static void CollectProjectMetrics(ProjectAnalysisResult projectAnalysisResult, string tgtFramework) {
        var projectMetrics = new ProjectMetrics{
            MetricsType = MetricsType.Project,
            TargetFramework = tgtFramework,
            SourceFrameworks = projectAnalysisResult.TargetFrameworks,
            TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
            ProjectGuid = Crypto.SHA256(projectAnalysisResult.ProjectGuid),
            ProjectType = projectAnalysisResult.ProjectType,
            NumNugets = projectAnalysisResult.PackageReferences.Count,
            NumReferences = projectAnalysisResult.ProjectReferences.Count,
            IsBuildFailed = projectAnalysisResult.IsBuildFailed,
            CompatibilityResult = projectAnalysisResult.ProjectCompatibilityResult
        };
      TelemetryCollector.Collect<ProjectMetrics>(projectMetrics);
      }

      public static void CollectNugetMetrics(Task<PackageAnalysisResult> result, string tgtFramework) {
        var nugetMetrics = new NugetMetrics
        {
            MetricsType = MetricsType.Nuget,
            TargetFramework = tgtFramework,
            TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
            PackageName = result.Result.PackageVersionPair.PackageId,
            PackageVersion = result.Result.PackageVersionPair.Version,
            Compatibility = result.Result.CompatibilityResults[tgtFramework].Compatibility
        };
        TelemetryCollector.Collect<NugetMetrics>(nugetMetrics);
      }

      public static void FileAssessmentCollect( IEnumerable<ApiAnalysisResult> selectedApis, string targetFramework)
        {
            var date = DateTime.Now;
            var apiMetrics = selectedApis.GroupBy(elem => new {elem.CodeEntityDetails.Name, elem.CodeEntityDetails.Namespace, elem.CodeEntityDetails.OriginalDefinition,
                                  elem.CodeEntityDetails.Package?.PackageId, elem.CodeEntityDetails.Signature}).Select(group => new APIMetrics{
                                        MetricsType = MetricsType.API,
                                        TargetFramework = targetFramework,
                                        TimeStamp = date.ToString("MM/dd/yyyy HH:mm"),
                                        Name = group.First().CodeEntityDetails.Name,
                                        NameSpace = group.First().CodeEntityDetails.Namespace,
                                        OriginalDefinition = group.First().CodeEntityDetails.OriginalDefinition,
                                        Compatibility = group.First().CompatibilityResults[targetFramework].Compatibility,
                                        PackageId = group.First().CodeEntityDetails.Package?.PackageId,
                                        PackageVersion = group.First().CodeEntityDetails.Package?.Version,
                                        ApiType = group.First().CodeEntityDetails.CodeEntityType.ToString(),
                                        HasActions = group.First().Recommendations.RecommendedActions.Any(action => action.RecommendedActionType != RecommendedActionType.NoRecommendation),
                                        ApiCounts = group.Count()
                                  });

              apiMetrics.ToList().ForEach(metric => TelemetryCollector.Collect(metric));
          }
        }
        }