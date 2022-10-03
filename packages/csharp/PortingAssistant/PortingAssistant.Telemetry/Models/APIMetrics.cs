using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using PortingAssistant.Client.Model;

namespace PortingAssistant.Telemetry.Model
{
    public class APIMetrics : MetricsBase
    {
        [JsonProperty("name")]
        public string Name { get; set; }
        [JsonProperty("nameSpace")]
        public string NameSpace { get; set; }
        [JsonProperty("originalDefinition")]
        public string OriginalDefinition { get; set; }
        [JsonProperty("compatibility")]
        [JsonConverter(typeof(StringEnumConverter))]
        public Compatibility Compatibility { get; set; }
        [JsonProperty("packageId")]
        public string PackageId { get; set; }
        [JsonProperty("packageVersion")]
        public string PackageVersion { get; set; }
        [JsonProperty("apiType")]
        public string ApiType { get; set; }
        [JsonProperty("hasActions")]
        public bool HasActions { get; set; }
        [JsonProperty("apiCounts")]
        public int ApiCounts { get; set; }
        [JsonProperty("sessionId")]
        new public string SessionId {get; set;}
    }
}