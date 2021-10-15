using System.Net.Http;
using Microsoft.Extensions.Options;
using PortingAssistant.Common.Model;

namespace PortingAssistant.Common.Services
{
    public class CustomerFeedbackService : ICustomerFeedbackService
    {
        private HttpClient _httpClient;
        private readonly string _apiEndpoint; 
        public CustomerFeedbackService(IHttpClientFactory httpClientFactory, IOptions<CustomerContributionConfiguration> options)
        {
            _httpClient = httpClientFactory.CreateClient("CustomerContribution");
            _apiEndpoint = options.Value.CustomerFeedbackEndpoint;
        }

        public bool UploadToS3(string key, string content)
        {
            return _httpClient.PutAsync($"{_apiEndpoint}?key={key}", new StringContent(content)).Result.IsSuccessStatusCode;
        }
    }
}
