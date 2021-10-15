namespace PortingAssistant.Common.Services
{
    public interface ICustomerFeedbackService
    {
        public bool UploadToS3(string key, string content);
    }
}
