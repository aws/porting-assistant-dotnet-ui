using System.Collections.Generic;
using PortingAssistant.Common.Model;
using PortingAssistant.Client.Model;

namespace PortingAssistant.Common.Services
{
    public interface IPortingService
    {
        Response<List<PortingResult>, List<PortingResult>> ApplyPortingChanges(ProjectFilePortingRequest request);
    }
}
