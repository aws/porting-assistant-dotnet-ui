using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using PortingAssistant.Client.Model;
using System;
using System.Collections.Generic;
using System.Text;

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