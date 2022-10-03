namespace PortingAssistant.Telemetry.Model
{
    public class SolutionMetrics : MetricsBase
    {
        public string SolutionPath { get; set; }
        public string ApplicationGuid { get; set; }
        public string SolutionGuid { get; set; }
        public string RepositoryUrl { get; set; }
        public double AnalysisTime { get; set; }
        public bool UsingDefaultCreds { get; set; }
        public bool Canceled {get; set;}
        new public string SessionId {get; set;}

    }
}