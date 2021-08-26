using PortingAssistant.Client.Model;

namespace PortingAssistant.Common.Model
{
    public class CustomerFeedbackRequest: Content
    {
        public string keyname { get; set; }

        public string accessKey { get; set; }

        public string secret { get; set; }

        public string timestamp { get; set; }
    }

    public class Content {
      
      public string feedback { get; set; }

      public string category { get; set; }

      public string date { get; set; }

      public string email { get; set; }

      public string machineID { get; set; }

    }
}