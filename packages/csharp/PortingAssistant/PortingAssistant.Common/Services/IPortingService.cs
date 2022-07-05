using PortingAssistant.Client.Model;
using PortingAssistant.Common.Model;
using System.Collections.Generic;

namespace PortingAssistant.Common.Services
{
    public interface IPortingService
    {
        Response<List<PortingResult>, List<PortingResult>> ApplyPortingChanges(ProjectFilePortingRequest request);
    }
}
