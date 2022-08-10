using PortingAssistantExtensionTelemetry.Model;
using System;
using System.IO;
using System.Linq;
using System.Net.NetworkInformation;
using PortingAssistant.Client.Telemetry;
using Serilog;

namespace PortingAssistant.Telemetry.Utils
{
    public static class LogUploadUtils
    {
        private static string GetLogName(string file)
        {
            var fName = Path.GetFileNameWithoutExtension(file);
            var logName = "";

            string typeOfLog = (fName.Split('-').Length > 1) ? fName.Split('-')[1] : String.Empty;

            if (typeOfLog.Equals("telemetry", StringComparison.OrdinalIgnoreCase))
            {
                logName = "portingAssistant-metrics";
            }
            else if (typeOfLog.Equals("backend", StringComparison.OrdinalIgnoreCase))
            {
                logName = "portingAssistant-backend-logs";
            }
            else if (typeOfLog.Equals("electron", StringComparison.OrdinalIgnoreCase))
            {
                logName = "electron-logs";
            }
            else if (typeOfLog.Equals("react", StringComparison.OrdinalIgnoreCase))
            {
                logName = "react-errors";
            }
            else if (typeOfLog.Equals("client", StringComparison.OrdinalIgnoreCase))
            {
                var suffix = Path.GetExtension(file);
                logName = suffix == ".log" ? "portingAssistant-client-cli-logs" : "portingAssistant-client-cli-metrics";
            }
            return logName;
        }

        public static Uploader Uploader;

        public static void InitializeUploader(bool shareMetric,
            TelemetryConfiguration config,
            string profile,
            bool enabledDefaultCredentials,
            ILogger logger)
        {
            TelemetryClientFactory.TryGetClient(profile, config, out ITelemetryClient client, enabledDefaultCredentials);
            Uploader = new Uploader(config, client, logger, shareMetric)
            {
                GetLogName = GetLogName
            };
        }

        public static void OnTimedEvent(
            Object source, 
            System.Timers.ElapsedEventArgs e)
        {
            Uploader.Run();
        }

        public static void WriteLogUploadErrors(
            Object source,
            System.Timers.ElapsedEventArgs e)
        {
            Uploader.WriteLogUploadErrors();
        }

        public static string getUniqueIdentifier()
        {
            string _uniqueId;
            string DefaultIdentifier = "591E6A97031144D5BADCE980EE3E51B7";
            var networkInterfaces = NetworkInterface.GetAllNetworkInterfaces()
                .Where(nic => nic.NetworkInterfaceType != NetworkInterfaceType.Loopback
                                && (nic.NetworkInterfaceType == NetworkInterfaceType.Wireless80211 || nic.NetworkInterfaceType == NetworkInterfaceType.Ethernet)
                                && nic.Speed > 0).ToList();
            // wifi network interface will always take higher precedence for retrieving physical address
            var wifiNetworkInterface = networkInterfaces.FirstOrDefault(wi => wi.NetworkInterfaceType == NetworkInterfaceType.Wireless80211);
            if (wifiNetworkInterface != null)
            {
                _uniqueId = CryptoUtil.HashString(wifiNetworkInterface.GetPhysicalAddress().ToString());
            }
            else
            {
                var ethernetInterface = networkInterfaces.LastOrDefault(ei => 
                    ei.NetworkInterfaceType == NetworkInterfaceType.Ethernet
                    && ei.OperationalStatus == OperationalStatus.Up 
                    && !ei.Name.Contains("Bluetooth", StringComparison.OrdinalIgnoreCase));

                _uniqueId = ethernetInterface != null 
                    ? CryptoUtil.HashString(ethernetInterface.GetPhysicalAddress().ToString()) 
                    : DefaultIdentifier;
            }
            return _uniqueId;
        }
    }
}