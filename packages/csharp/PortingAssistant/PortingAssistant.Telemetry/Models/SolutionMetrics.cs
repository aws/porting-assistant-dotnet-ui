namespace PortingAssistant.Telemetry.Model
{
    public class SolutionMetrics : MetricsBase
    {
        public string SolutionPath { get; set; }
        public string ApplicationGuid { get; set; }
        public string SolutionGuid { get; set; }
        public string RepositoryUrl { get; set; }
        public double AnalysisTime { get; set; }
    }
}