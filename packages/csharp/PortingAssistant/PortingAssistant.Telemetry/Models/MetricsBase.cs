using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.Linq;
using System.Net.NetworkInformation;
using System.Web.Helpers;
using PortingAssistant.Telemetry.Utils;

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

        // This identifier will be used as default, if there are no active network interface adapters on the machine
        private const string DefaultIdentifier = "591E6A97031144D5BADCE980EE3E51B7";
        /// <summary> 
        /// This property uniquely identifies the customers using porting assistant
        /// Auto populate this field for all the metric logs
        /// </summary>
        private string _uniqueId;
        public string UniqueId
        {
            get
            {
              if (!string.IsNullOrWhiteSpace(_uniqueId) && !_uniqueId.Equals(DefaultIdentifier)) return _uniqueId;
              return LogUploadUtils.getUniqueIdentifier();
            }
        }
    }

}