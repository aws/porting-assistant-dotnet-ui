using ElectronCgi.DotNet;
using PortingAssistant.Client.Model;
using PortingAssistant.Telemetry.Utils;
using PortingAssistantExtensionTelemetry.Model;
using System;
using System.Collections.Generic;
using System.IO;

namespace PortingAssistant.Telemetry
{
    class Program
    {
        public static void Main(string[] args)
        {
            if (args.Length < 5)
            {
                throw new ArgumentException
                    (
                    "Must provide a telemetry config file, " +
                    "aws profile, user data path and app version."
                    );
            }

            var config = args[0];
            var profile = args[1];
            var userData = args[2];
            var useDefaultCreds = System.Convert.ToBoolean(args[4]);
            var shareMetric = System.Convert.ToBoolean(args[5]);
            Connection _connection = new ConnectionBuilder().WithLogging().Build();
            var portingAssistantPortingConfiguration = System.Text.Json.JsonSerializer.Deserialize<PortingAssistantPortingConfiguration>(File.ReadAllText(config));
            string metricsFolder = Path.Combine(userData, "logs");
            TelemetryConfiguration teleConfig = new TelemetryConfiguration
            {
                InvokeUrl = portingAssistantPortingConfiguration.PortingAssistantMetrics["InvokeUrl"].ToString(),
                Region = portingAssistantPortingConfiguration.PortingAssistantMetrics["Region"].ToString(),
                ServiceName = portingAssistantPortingConfiguration.PortingAssistantMetrics["ServiceName"].ToString(),
                Description = portingAssistantPortingConfiguration.PortingAssistantMetrics["Description"].ToString(),
                LogsPath = metricsFolder,
                LogFilePath = Path.Combine(metricsFolder, $"portingAssistant-telemetry-{DateTime.Today.ToString("yyyyMMdd")}.log"),
                MetricsFilePath = Path.Combine(metricsFolder, $"portingAssistant-telemetry-{DateTime.Today.ToString("yyyyMMdd")}.metrics"),
                Suffix = new List<string>() { ".log", ".metrics" }
            };
            var lastReadTokenFile = Path.Combine(teleConfig.LogsPath, "lastToken.json");
            string prefix = portingAssistantPortingConfiguration.PortingAssistantMetrics["Prefix"].ToString();
            
            var logTimer = new System.Timers.Timer();
            logTimer.Interval = Convert.ToDouble(portingAssistantPortingConfiguration.PortingAssistantMetrics["LogTimerInterval"].ToString());

            logTimer.Elapsed += (source, e) => LogUploadUtils.OnTimedEvent(source, e, teleConfig, lastReadTokenFile, profile, useDefaultCreds, prefix, shareMetric);

            logTimer.AutoReset = true;

            logTimer.Enabled = true;

            _connection.Listen();
        }

        private class PortingAssistantPortingConfiguration
        {
            public PortingAssistantConfiguration PortingAssistantConfiguration { get; set; }
            public Dictionary<string, object> PortingAssistantMetrics { get; set; }
        }

    }

}