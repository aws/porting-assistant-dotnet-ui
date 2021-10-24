using PortingAssistant.Client.Model;

namespace PortingAssistant.Common.Model
{
    public class CustomerFeedbackRequest
    {
        public string Feedback { get; set; }
        public string Category { get; set; }
        public string Date { get; set; }
        public string Email { get; set; }
        public string MachineID { get; set; }
    }
}