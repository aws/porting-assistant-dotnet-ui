namespace PortingAssistant.Telemetry.Model
{
    public class CrashMetrics : MetricsBase
    {
        public string FileName { get; set; }
        public string CreationTimeUTC { get; set; }
        new public string SessionId {get; set;}
    }
}