using PortingAssistant.Client.Model;

namespace PortingAssistant.Common.Model
{
    public class AnalyzeSolutionRequest
    {
        public string solutionFilePath { get; set; }

        public string runId { get; set; }

        public string triggerType { get; set; }

        public AnalyzerSettings settings { get; set; }

        public string[] preTriggerData { get; set; }
    }
    public class ProjectTableData
    {
        public string projectName { get; set; }
        public string projectPath { get; set; }
        public string solutionPath { get; set; }
        public string targetFramework { get; set; }
        public int? referencedProjects { get; set; }
        public int? incompatiblePackages { get; set; }
        public int? totalPackages { get; set; }
        public int? incompatibleApis { get; set; }
        public int? totalApis { get; set; }
        public int? buildErrors { get; set; }
        public int? portingActions { get; set; }
        public bool ported { get; set; }
        public bool buildFailed { get; set; }
    }
}
