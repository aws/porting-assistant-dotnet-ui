using PortingAssistant.Client.Model;

namespace PortingAssistant.Common.Model
{
    public class AnalyzeSolutionRequest
    {
        public string solutionFilePath { get; set; }

        public string runId { get; set; }

        public string triggerType { get; set; }

        public AnalyzerSettings settings { get; set; }
    }
}
