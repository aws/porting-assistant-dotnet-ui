using System.Collections.Generic;
using PortingAssistant.Common.Listener;
using PortingAssistant.Common.Model;
using PortingAssistant.Client.Model;

namespace PortingAssistant.Common.Services
{
    public interface IAssessmentService
    {
        Response<SolutionDetails, string> AnalyzeSolution(AnalyzeSolutionRequest request);      
        void AddApiAnalysisListener(OnApiAnalysisUpdate listener);
        void AddNugetPackageListener(OnNugetPackageUpdate listener);
    }
}
