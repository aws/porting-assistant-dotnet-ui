using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Linq;
using System.Net.NetworkInformation;

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

        /// <summary>
        /// This property uniquely identifies the customers using porting assistant 
        /// Auto populate this field for all the metric logs
        /// </summary>
        private string _customerID;
        public string CustomerID
        {
            get
            {
                if (string.IsNullOrWhiteSpace(_customerID))
                {
                    _customerID = NetworkInterface.GetAllNetworkInterfaces()
                                         .Where(nic => nic.OperationalStatus == OperationalStatus.Up && nic.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                                         .Select(nic => nic.GetPhysicalAddress().ToString())
                                         .FirstOrDefault();
                }
                return _customerID;
            }
        }
    }
}