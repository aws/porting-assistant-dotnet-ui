namespace PortingAssistant.Common.Model
{
    public class RuleContributionRequest
    {
        public string contents { get; set; }
        public string keyName { get; set; }
        public string accessKey { get; set; }

        public string secret { get; set; }
        public string region { get; set; }
        public string s3BucketName { get; set; }
    }
}
