using PortingAssistant.Client.Common.Utils;
using PortingAssistant.Client.Model;
using PortingAssistant.Common.Model;
using PortingAssistant.Telemetry.Model;
using PortingAssistant.Telemetry.Utils;
using PortingAssistantExtensionTelemetry;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PortingAssistant.Common.Utils
{
    public static class TelemetryCollectionUtils
    {
        private static readonly int _numLogicalCores = Environment.ProcessorCount;
        private static readonly double _systemMemory = GC.GetGCMemoryInfo().TotalAvailableMemoryBytes / 1048576.0;
        
        public static void CollectSolutionMetrics(SolutionAnalysisResult solutionAnalysisResult, AnalyzeSolutionRequest request, DateTime startTime, string tgtFramework, double firstProjectAnalysisTime, int numProjects, bool canceled=false)
        {
            var solutionMetrics = createSolutionMetric(solutionAnalysisResult, request.runId, request.triggerType, tgtFramework, startTime, firstProjectAnalysisTime, numProjects, canceled);
            TelemetryCollector.Collect<SolutionMetrics>(solutionMetrics);
        }

        public static void CollectStartMetrics(AnalyzeSolutionRequest request, DateTime startTime, string tgtFramework, bool canceled=false)
        {
            var startMetric = createStartMetric(request.solutionFilePath, request.runId, request.triggerType, tgtFramework, startTime, canceled);
            TelemetryCollector.Collect<SolutionMetrics>(startMetric);
        }

        public static void CollectEndMetrics(AnalyzeSolutionRequest request, DateTime startTime, string tgtFramework, bool canceled=false)
        {
            var endMetric = createEndMetric(request.solutionFilePath, request.runId, request.triggerType, tgtFramework, startTime, canceled);
            TelemetryCollector.Collect<SolutionMetrics>(endMetric);
        }

        public static void CollectCrashMetrics(string fileName, DateTime creationTime)
        {
            var crashMetric = createCrashMetric(fileName, creationTime);
            TelemetryCollector.Collect<CrashMetrics>(crashMetric);
        }

        public static void CollectProjectMetrics(ProjectAnalysisResult projectAnalysisResult, AnalyzeSolutionRequest request, string tgtFramework, double assessmentTime, double cumulativeAnalysisTime, PreTriggerData preTriggerData = null)
        {
            var projectMetrics = createProjectMetric(request.runId, request.triggerType, tgtFramework, projectAnalysisResult, assessmentTime, cumulativeAnalysisTime, preTriggerData);
            TelemetryCollector.Collect<ProjectMetrics>(projectMetrics);
        }

        public static void CollectNugetMetrics(Task<PackageAnalysisResult> packageAnalysisResult, AnalyzeSolutionRequest request, string tgtFramework)
        {
            var nugetMetrics = createNugetMetric(request.runId, request.triggerType, tgtFramework, packageAnalysisResult);
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

        public static SolutionMetrics createSolutionMetric(SolutionAnalysisResult solutionAnalysisResult, string runId, string triggerType, string tgtFramework, DateTime startTime, double firstProjectAnalysisTime, int numProjects, bool canceled)
        {
            return new SolutionMetrics
            {
                MetricsType = MetricsType.Solution,
                RunId = runId,
                TriggerType = triggerType,
                TargetFramework = tgtFramework,
                TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
                SolutionPath = CryptoUtil.HashString(solutionAnalysisResult.SolutionDetails.SolutionFilePath),
                ApplicationGuid = solutionAnalysisResult.SolutionDetails.ApplicationGuid,
                SolutionGuid = solutionAnalysisResult.SolutionDetails.SolutionGuid,
                RepositoryUrl = solutionAnalysisResult.SolutionDetails.RepositoryUrl,
                AnalysisTime = DateTime.Now.Subtract(startTime).TotalMilliseconds,
                PortingAssistantVersion = MetricsBase.Version,
                UsingDefaultCreds = MetricsBase.UsingDefault,
                Canceled = canceled,
                SessionId = MetricsBase.SessionId,
                FirstProjectAnalysisTime = firstProjectAnalysisTime,
                NumProjects = numProjects,
                LinesOfCode = solutionAnalysisResult.SolutionDetails.Projects.Sum(p => p.LinesOfCode),
                NumLogicalCores = _numLogicalCores,
                SystemMemory = _systemMemory
            };
        }

        public static SolutionMetrics createStartMetric(string solutionPath, string runId, string triggerType, string tgtFramework, DateTime startTime, bool canceled)
        {
            return new SolutionMetrics
            {
                MetricsType = MetricsType.Start,
                RunId = runId,
                TriggerType = triggerType,
                TargetFramework = tgtFramework,
                TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
                SolutionPath = CryptoUtil.HashString(solutionPath),
                PortingAssistantVersion = MetricsBase.Version,
                UsingDefaultCreds = MetricsBase.UsingDefault,
                Canceled = canceled,
                SessionId = MetricsBase.SessionId,
            };
        }

        public static SolutionMetrics createEndMetric(string solutionPath, string runId, string triggerType, string tgtFramework, DateTime startTime, bool canceled)
        {
            return new SolutionMetrics
            {
                MetricsType = MetricsType.End,
                RunId = runId,
                TriggerType = triggerType,
                TargetFramework = tgtFramework,
                TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
                SolutionPath = CryptoUtil.HashString(solutionPath),
                PortingAssistantVersion = MetricsBase.Version,
                UsingDefaultCreds = MetricsBase.UsingDefault,
                Canceled = canceled,
                SessionId = MetricsBase.SessionId,
            };
        }

        public static CrashMetrics createCrashMetric(string fileName, DateTime creationTime)
        {
            return new CrashMetrics
            {
                MetricsType = MetricsType.Crash,
                FileName = fileName,
                CreationTimeUTC = creationTime.ToString(),
                SessionId = MetricsBase.SessionId,
                PortingAssistantVersion = MetricsBase.Version
            };
        }
        public static ProjectMetrics createProjectMetric(string runId, string triggerType, string tgtFramework, ProjectAnalysisResult projectAnalysisResult, double assessmentTime, double cumulativeAnalysisTime, PreTriggerData preTriggerData = null)
        {
            var compatabilityResult = projectAnalysisResult.ProjectCompatibilityResult;
            compatabilityResult.ProjectPath = CryptoUtil.HashString(compatabilityResult.ProjectPath);
            return new ProjectMetrics
            {
                MetricsType = MetricsType.Project,
                RunId = runId,
                TriggerType = triggerType,
                TargetFramework = tgtFramework,
                SourceFrameworks = projectAnalysisResult.TargetFrameworks,
                TimeStamp = DateTime.Now.ToString("MM/dd/yyyy HH:mm"),
                ProjectGuid = CryptoUtil.HashString(projectAnalysisResult.ProjectGuid),
                ProjectType = projectAnalysisResult.ProjectType,
                NumNugets = projectAnalysisResult.PackageReferences.Count,
                NumReferences = projectAnalysisResult.ProjectReferences.Count,
                IsBuildFailed = projectAnalysisResult.IsBuildFailed,
                CompatibilityResult = compatabilityResult,
                PortingAssistantVersion = MetricsBase.Version,
                PreApiInCompatibilityCount = preTriggerData?.incompatibleApis,
                PostApiInCompatibilityCount = GetIncompatibleApiCount(projectAnalysisResult),
                PreFramework = preTriggerData?.targetFramework,
                PreBuildErrorCount = preTriggerData?.buildErrors,
                PostBuildErrorCount = projectAnalysisResult.Errors.Count,
                ProjectLanguage = GetProjectLanguage(projectAnalysisResult.ProjectFilePath),
                SessionId = MetricsBase.SessionId,
                AnalysisTime = assessmentTime,
                CumulativeAnalysisTime = cumulativeAnalysisTime,
                LinesOfCode = projectAnalysisResult.LinesOfCode
            };
        }

        public static int GetIncompatibleApiCount(ProjectAnalysisResult projectAnalysisResult) {
            var dictionary = new Dictionary<string, bool>();
            var sourceFileAnalysisResults = projectAnalysisResult.SourceFileAnalysisResults;
            sourceFileAnalysisResults.ForEach(SourceFileAnalysisResult =>
            {
                SourceFileAnalysisResult.ApiAnalysisResults.ForEach(apiAnalysisResult =>
                {
                    var compatibility = apiAnalysisResult.CompatibilityResults?.FirstOrDefault().Value?.Compatibility;
                    bool isCompatible = (compatibility == Compatibility.UNKNOWN || compatibility == Compatibility.COMPATIBLE);
                    var key = apiAnalysisResult.CodeEntityDetails?.OriginalDefinition + "-" +
                        apiAnalysisResult.CodeEntityDetails?.Package?.PackageId?.ToLower() + "-" +
                        apiAnalysisResult.CodeEntityDetails?.Package?.Version?.ToLower();
                    if (!dictionary.ContainsKey(key))
                    {
                        dictionary.Add(key, isCompatible);
                    }
                });
            });
            return dictionary.Count - dictionary.Count(c => c.Value);
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
                PortingAssistantVersion = MetricsBase.Version,
                SessionId = MetricsBase.SessionId,
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
                PortingAssistantVersion = MetricsBase.Version,
                SessionId = MetricsBase.SessionId,
            };
        }

        private static string GetProjectLanguage(string projectFilePath)
        {
            if (projectFilePath.EndsWith(".csproj"))
            {
                return "csharp";
            }
            if (projectFilePath.EndsWith(".vbproj"))
            {
                return "visualbasic";
            }
            return "invalid";
        }
    }
}