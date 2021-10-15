namespace PortingAssistant.Common.Model
{
    public class CustomerContributionConfiguration
    {
        public string CustomerFeedbackEndpoint { get; set; }
        public string RuleContributionEndpoint { get; set; }

        public CustomerContributionConfiguration DeepCopy(CustomerContributionConfiguration that)
        {
            that.CustomerFeedbackEndpoint = this.CustomerFeedbackEndpoint;
            that.RuleContributionEndpoint = this.RuleContributionEndpoint;
            return that;
        }
    }
}
