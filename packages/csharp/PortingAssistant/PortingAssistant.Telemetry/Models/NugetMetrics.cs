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
        public string packageName { get; set; }
        public string packageVersion { get; set; }
        [JsonConverter(typeof(StringEnumConverter))]
        public Compatibility compatibility { get; set; }
    }
}