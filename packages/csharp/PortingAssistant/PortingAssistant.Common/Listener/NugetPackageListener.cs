using PortingAssistant.Common.Model;
using PortingAssistant.Client.Model;

namespace PortingAssistant.Common.Listener
{
    public delegate void OnNugetPackageUpdate(Response<PackageAnalysisResult, PackageVersionPair> response);
}
