using System;
using System.Collections.Generic;
using System.Text;
using System.Runtime.Serialization;

namespace PortingAssistant.Telemetry.Model
{
    public enum MetricsType
    {
        [EnumMember(Value ="Project")]
        Project,
        [EnumMember(Value = "Solutions")]
        Solution,
        [EnumMember(Value = "apis")]
        API,
        [EnumMember(Value = "nuget")]
        Nuget,
    }
}