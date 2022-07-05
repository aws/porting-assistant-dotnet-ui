using PortingAssistant.Client.Model;
using PortingAssistant.Common.Listener;
using PortingAssistant.Common.Model;

namespace PortingAssistant.Common.Services
{
    public interface IAssessmentService
    {
        Response<SolutionDetails, string> AnalyzeSolution(AnalyzeSolutionRequest request);
        void AddApiAnalysisListener(OnApiAnalysisUpdate listener);
        void AddNugetPackageListener(OnNugetPackageUpdate listener);
    }
}
