using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace PortingAssistant.Telemetry.Model
{
    public class MetricsBase
    {
        [JsonConverter(typeof(StringEnumConverter))]
        public MetricsType MetricsType { get; set; }
        public string RunId { get; set; }
        public string TriggerType { get; set; }
        public string PortingAssistantVersion { get; set; }
        public string TargetFramework { get; set; }
        public string TimeStamp { get; set; }
    }
}