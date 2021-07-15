using System.Threading.Tasks;
using PortingAssistant.Client.Model;
using System;
using PortingAssistant.Common.Model;
using PortingAssistant.Telemetry.Model;
using System.Web.Helpers;
using PortingAssistantExtensionTelemetry;
using System.Linq;
using System.IO;
using Serilog;
using System.Collections.Generic;
using System.Text;

namespace PortingAssistant.Common.Utils
{
    public static class TelemetryCollectionUtils
    {
      public static void collectSolutionMetrics(Task<SolutionAnalysisResult> solutionAnalysisResult, AnalyzeSolutionRequest request, DateTime startTime, string tgtFramework) {
        string solutionPath = request.solutionFilePath;
        if (solutionPath == null) solutionPath = "";
        var solutionMetrics = new SolutionMetrics{
          MetricsType = MetricsType.Solutions,
          TargetFramework = tgtFramework,
          TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
          SolutionPath = Crypto.SHA256(solutionPath),
          AnalysisTime = DateTime.Now.Subtract(startTime).TotalMilliseconds
        };
        TelemetryCollector.Collect<SolutionMetrics>(solutionMetrics);
      }

      public static void collectProjectMetrics(ProjectAnalysisResult projectAnalysisResult, string tgtFramework) {
        var projectMetrics = new ProjectMetrics{
            MetricsType = MetricsType.Project,
            TargetFramework = tgtFramework,
            sourceFrameworks = projectAnalysisResult.TargetFrameworks,
            TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
            projectGuid = Crypto.SHA256(projectAnalysisResult.ProjectGuid),
            projectType = projectAnalysisResult.ProjectType,
            numNugets = projectAnalysisResult.PackageReferences.Count,
            numReferences = projectAnalysisResult.ProjectReferences.Count,
            isBuildFailed = projectAnalysisResult.IsBuildFailed,
            compatibilityResult = projectAnalysisResult.ProjectCompatibilityResult
        };
      TelemetryCollector.Collect<ProjectMetrics>(projectMetrics);
      }

      public static void collectNugetMetrics(Task<PackageAnalysisResult> result, string tgtFramework) {
        var nugetMetrics = new NugetMetrics
        {
            MetricsType = MetricsType.nuget,
            TargetFramework = tgtFramework,
            TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
            packageName = result.Result.PackageVersionPair.PackageId,
            packageVersion = result.Result.PackageVersionPair.Version,
            compatibility = result.Result.CompatibilityResults[tgtFramework].Compatibility
        };
        TelemetryCollector.Collect<NugetMetrics>(nugetMetrics);
      }

      public static void FileAssessmentCollect( IEnumerable<ApiAnalysisResult> selectedApis, string targetFramework)
        {
            var date = DateTime.Now;
            var apiMetrics = selectedApis.GroupBy(elem => new {elem.CodeEntityDetails.Name, elem.CodeEntityDetails.Namespace, elem.CodeEntityDetails.OriginalDefinition,
                                  elem.CodeEntityDetails.Package?.PackageId, elem.CodeEntityDetails.Signature}).Select(group => new APIMetrics{
                                        MetricsType = MetricsType.apis,
                                        TargetFramework = targetFramework,
                                        TimeStamp = date.ToString("MM/dd/yyyy HH:mm"),
                                        name = group.First().CodeEntityDetails.Name,
                                        nameSpace = group.First().CodeEntityDetails.Namespace,
                                        originalDefinition = group.First().CodeEntityDetails.OriginalDefinition,
                                        compatibility = group.First().CompatibilityResults[targetFramework].Compatibility,
                                        packageId = group.First().CodeEntityDetails.Package?.PackageId,
                                        packageVersion = group.First().CodeEntityDetails.Package?.Version,
                                        apiType = group.First().CodeEntityDetails.CodeEntityType.ToString(),
                                        hasActions = group.First().Recommendations.RecommendedActions.Any(action => action.RecommendedActionType != RecommendedActionType.NoRecommendation),
                                        apiCounts = group.Count()
                                  });

              apiMetrics.ToList().ForEach(metric => TelemetryCollector.Collect(metric));
          }
        }
        }