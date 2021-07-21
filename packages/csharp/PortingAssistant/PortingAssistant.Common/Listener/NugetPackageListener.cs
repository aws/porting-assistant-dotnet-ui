using PortingAssistant.Client.Model;
using PortingAssistant.Common.Model;

namespace PortingAssistant.Common.Listener
{
    public delegate void OnNugetPackageUpdate(Response<PackageAnalysisResult, PackageVersionPair> response);
}
