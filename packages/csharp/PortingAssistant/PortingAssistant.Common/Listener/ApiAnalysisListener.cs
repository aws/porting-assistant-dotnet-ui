using PortingAssistant.Common.Model;
using PortingAssistant.Client.Model;

namespace PortingAssistant.Common.Listener
{
    public delegate void OnApiAnalysisUpdate(Response<ProjectApiAnalysisResult, SolutionProject> response);
}
