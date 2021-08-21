using PortingAssistant.Client.Model;

namespace PortingAssistant.Common.Model
{
    public class CustomerFeedbackRequest
    {
        public string contents { get; set; }

        public string keyname { get; set; }

        public string accessKey { get; set; }

        public string secret { get; set; }

        public string timestamp { get; set; }
    }
}