using PortingAssistant.Client.Model;
using PortingAssistant.Common.Listener;
using PortingAssistant.Common.Model;
using System.Threading.Tasks;

namespace PortingAssistant.Common.Services
{
    public interface IAssessmentService
    {
        Task<Response<SolutionDetails, string>> AnalyzeSolution(AnalyzeSolutionRequest request);
        void AddApiAnalysisListener(OnApiAnalysisUpdate listener);
        void AddNugetPackageListener(OnNugetPackageUpdate listener);
    }
}
