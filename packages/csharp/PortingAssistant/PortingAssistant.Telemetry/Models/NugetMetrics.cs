using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using PortingAssistant.Client.Model;

namespace PortingAssistant.Telemetry.Model
{
    public class NugetMetrics : MetricsBase
    {
        [JsonProperty("packageName")]
        public string PackageName { get; set; }
        [JsonProperty("packageVersion")]
        public string PackageVersion { get; set; }
        [JsonProperty("compatibility")]
        [JsonConverter(typeof(StringEnumConverter))]
        public Compatibility Compatibility { get; set; }
    }
}