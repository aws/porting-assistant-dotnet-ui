using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Client;
using PortingAssistant.Client.Model;
using PortingAssistant.Common.Model;
using System;
using System.Collections.Generic;
using System.Linq;


namespace PortingAssistant.Common.Services
{

    public class PortingService : IPortingService
    {
        private readonly IPortingAssistantClient _client;
        private readonly ILogger<PortingService> _logger;

        public PortingService(ILogger<PortingService> logger, IPortingAssistantClient client)
        {
            _client = client;
            _logger = logger;
        }

        public Response<List<PortingResult>, List<PortingResult>> ApplyPortingChanges(ProjectFilePortingRequest request)
        {
            try
            {
                var portingRequst = new PortingRequest
                {
                    Projects = request.Projects,
                    SolutionPath = request.SolutionPath,
                    RecommendedActions = request.RecommendedActions.Select(r => (RecommendedAction)r).ToList(),
                    TargetFramework = request.TargetFramework,
                    IncludeCodeFix = true
                };

                var results = _client.ApplyPortingChanges(portingRequst);
                return new Response<List<PortingResult>, List<PortingResult>>
                {
                    Value = results.Where(r => r.Success == true).ToList(),
                    Status = Response<List<PortingResult>, List<PortingResult>>.Success(),
                    ErrorValue = results.Where(r => r.Success == false).ToList()
                };
            }
            catch (Exception ex)
            {
                return new Response<List<PortingResult>, List<PortingResult>>
                {
                    Status = Response<List<PortingResult>, List<PortingResult>>.Failed(ex),
                };
            }
        }
    }
}
