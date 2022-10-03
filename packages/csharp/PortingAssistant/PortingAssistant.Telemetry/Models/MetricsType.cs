using System.Runtime.Serialization;

namespace PortingAssistant.Telemetry.Model
{
    public enum MetricsType
    {
        [EnumMember(Value = "Project")]
        Project,
        [EnumMember(Value = "Solutions")]
        Solution,
        [EnumMember(Value = "apis")]
        API,
        [EnumMember(Value = "nuget")]
        Nuget,
        [EnumMember(Value = "start")]
        Start,
        [EnumMember(Value = "end")]
        End,
        [EnumMember(Value = "crash")]
        Crash,
    }
}