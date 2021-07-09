using System.Threading.Tasks;
using PortingAssistant.Client.Model;
using System;
using PortingAssistant.Common.Model;
using PortingAssistant.Telemetry.Model;
using System.Web.Helpers;
using PortingAssistantExtensionTelemetry;

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

      public static void FileAssessmentCollect(SourceFileAnalysisResult result, string targetFramework)
        {
            var date = DateTime.Now;
            foreach (var api in result.ApiAnalysisResults)
            {
                var apiMetrics = new APIMetrics
                {
                    MetricsType = MetricsType.apis,
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