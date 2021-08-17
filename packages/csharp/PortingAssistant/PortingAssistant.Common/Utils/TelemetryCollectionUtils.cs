using PortingAssistant.Client.Model;
using PortingAssistant.Common.Model;
using PortingAssistant.Telemetry.Model;
using PortingAssistantExtensionTelemetry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Helpers;

namespace PortingAssistant.Common.Utils
{
    public static class TelemetryCollectionUtils
    {
        public static void CollectSolutionMetrics(Task<SolutionAnalysisResult> solutionAnalysisResult, AnalyzeSolutionRequest request, DateTime startTime, string tgtFramework)
        {
            string solutionPath = request.solutionFilePath;
            if (solutionPath == null) solutionPath = "";
            var solutionMetrics = createSolutionMetric(solutionPath, request.runId, request.triggerType, tgtFramework, startTime);
            TelemetryCollector.Collect<SolutionMetrics>(solutionMetrics);
        }

        public static void CollectProjectMetrics(ProjectAnalysisResult projectAnalysisResult, AnalyzeSolutionRequest request, string tgtFramework)
        {
            var projectMetrics = createProjectMetric(request.runId, request.triggerType, tgtFramework, projectAnalysisResult);
            TelemetryCollector.Collect<ProjectMetrics>(projectMetrics);
        }

        public static void CollectNugetMetrics(Task<PackageAnalysisResult> result, AnalyzeSolutionRequest request, string tgtFramework)
        {
            var nugetMetrics = createNugetMetric(request.runId, request.triggerType, tgtFramework, result);
            TelemetryCollector.Collect<NugetMetrics>(nugetMetrics);
        }

        public static void FileAssessmentCollect(IEnumerable<ApiAnalysisResult> selectedApis, AnalyzeSolutionRequest request)
        {
            var date = DateTime.Now;
            var apiMetrics = selectedApis.GroupBy(elem => new
            {
                elem.CodeEntityDetails.Name,
                elem.CodeEntityDetails.Namespace,
                elem.CodeEntityDetails.OriginalDefinition,
                elem.CodeEntityDetails.Package?.PackageId,
                elem.CodeEntityDetails.Signature
            }).Select(
                group => createAPIMetric(request.runId, request.triggerType, request.settings.TargetFramework, date, group.First(), group.Count())
                );

            apiMetrics.ToList().ForEach(metric => TelemetryCollector.Collect(metric));
        }

        public static SolutionMetrics createSolutionMetric(string solutionPath, string runId, string triggerType, string tgtFramework, DateTime startTime)
        {
            return new SolutionMetrics
            {
                MetricsType = MetricsType.Solution,
                RunId = runId,
                TriggerType = triggerType,
                TargetFramework = tgtFramework,
                TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
                SolutionPath = Crypto.SHA256(solutionPath),
                AnalysisTime = DateTime.Now.Subtract(startTime).TotalMilliseconds,
                PortingAssistantVersion = PortingAssistant.Telemetry.PortingAssistantAppVersion.version
            };
        }
        public static ProjectMetrics createProjectMetric(string runId, string triggerType, string tgtFramework, ProjectAnalysisResult projectAnalysisResult)
        {
            return new ProjectMetrics
            {
                MetricsType = MetricsType.Project,
                RunId = runId,
                TriggerType = triggerType,
                TargetFramework = tgtFramework,
                SourceFrameworks = projectAnalysisResult.TargetFrameworks,
                TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
                ProjectGuid = Crypto.SHA256(projectAnalysisResult.ProjectGuid),
                ProjectType = projectAnalysisResult.ProjectType,
                NumNugets = projectAnalysisResult.PackageReferences.Count,
                NumReferences = projectAnalysisResult.ProjectReferences.Count,
                IsBuildFailed = projectAnalysisResult.IsBuildFailed,
                CompatibilityResult = projectAnalysisResult.ProjectCompatibilityResult,
                PortingAssistantVersion = PortingAssistant.Telemetry.PortingAssistantAppVersion.version
            };
        }

        public static NugetMetrics createNugetMetric(string runId, string triggerType, string tgtFramework, Task<PackageAnalysisResult> result)
        { 
            return new NugetMetrics
            {
                MetricsType = MetricsType.Nuget,
                RunId = runId,
                TriggerType = triggerType,
                TargetFramework = tgtFramework,
                TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
                PackageName = result.Result.PackageVersionPair.PackageId,
                PackageVersion = result.Result.PackageVersionPair.Version,
                Compatibility = result.Result.CompatibilityResults[tgtFramework].Compatibility,
                PortingAssistantVersion = PortingAssistant.Telemetry.PortingAssistantAppVersion.version
            };
        }

        public static APIMetrics createAPIMetric(string runId, string triggerType, string tgtFramework, DateTime date, ApiAnalysisResult api, int count)
        {
            return new APIMetrics
            {
                MetricsType = MetricsType.API,
                RunId = runId,
                TriggerType = triggerType,
                TargetFramework = tgtFramework,
                TimeStamp = date.ToString("MM/dd/yyyy HH:mm"),
                Name = api.CodeEntityDetails.Name,
                NameSpace = api.CodeEntityDetails.Namespace,
                OriginalDefinition = api.CodeEntityDetails.OriginalDefinition,
                Compatibility = api.CompatibilityResults[tgtFramework].Compatibility,
                PackageId = api.CodeEntityDetails.Package?.PackageId,
                PackageVersion = api.CodeEntityDetails.Package?.Version,
                ApiType = api.CodeEntityDetails.CodeEntityType.ToString(),
                HasActions = api.Recommendations.RecommendedActions.Any(action => action.RecommendedActionType != RecommendedActionType.NoRecommendation),
                ApiCounts = count,
                PortingAssistantVersion = PortingAssistant.Telemetry.PortingAssistantAppVersion.version
            };
        }
    }
}