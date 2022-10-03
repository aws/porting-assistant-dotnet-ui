using Newtonsoft.Json;
using PortingAssistant.Client.Common.Model;
using System;
using System.Collections.Generic;


namespace PortingAssistant.Telemetry.Model
{
    public class ProjectMetrics : MetricsBase
    {
        [JsonProperty("numNugets")]
        public int NumNugets { get; set; }
        [JsonProperty("numReferences")]
        public int NumReferences { get; set; }
        [JsonProperty("projectGuid")]
        public string ProjectGuid { get; set; }
        [JsonProperty("isBuildFailed")]
        public bool IsBuildFailed { get; set; }
        [JsonProperty("projectType")]
        public string ProjectType { get; set; }
        [JsonProperty("sourceFrameworks")]
        public List<String> SourceFrameworks { get; set; }
        [JsonProperty("compatibilityResult")]
        public ProjectCompatibilityResult CompatibilityResult { get; set; }
        [JsonProperty("preCompatibilityResult")]
        public ProjectCompatibilityResult PreCompatibilityResult { get; set; }
        [JsonProperty("preApiInCompatibilityCount")]
        public int? PreApiInCompatibilityCount  { get; set; }
        [JsonProperty("postApiInCompatibilityCount")]
        public int? PostApiInCompatibilityCount { get; set; }
        [JsonProperty("preBuildErrorCount")]
        public int? PreBuildErrorCount { get; set; }
        [JsonProperty("postBuildErrorCount")]
        public int? PostBuildErrorCount { get; set; }
        [JsonProperty("preFramework")]
        public string? PreFramework { get; set; }
        [JsonProperty("projectLanguage")]
        public string? ProjectLanguage { get; set;}
        [JsonProperty("sessionId")]
        new public string SessionId {get; set;}
    }
}