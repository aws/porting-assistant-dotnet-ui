using System;
using Serilog;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;
using PortingAssistant.Telemetry.Model;
using PortingAssistant.Client.Model;

namespace PortingAssistant.Telemetry
{
    class Program
    {
        public static void Main(string[] args)
        {
            if (args.Length < 3)
            {
                throw new ArgumentException
                    (
                    "Must provide a telemetry config file, " +
                    "aws profile and user data path."
                    );
            }

            var config = args[0];
            var profile = args[1];
            var userData = args[2];

            var portingAssistantPortingConfiguration = JsonSerializer.Deserialize<PortingAssistantPortingConfiguration>(File.ReadAllText(config));
            string metricsFolder = Path.Combine(userData, "telemetry-logs");
            Directory.CreateDirectory(metricsFolder);
            TelemetryConfiguration teleConfig = new TelemetryConfiguration{
              InvokeUrl = portingAssistantPortingConfiguration.PortingAssistantMetrics["InvokeUrl"].ToString(),
              Region = portingAssistantPortingConfiguration.PortingAssistantMetrics["Region"].ToString(),
              ServiceName = portingAssistantPortingConfiguration.PortingAssistantMetrics["ServiceName"].ToString(),
              Description = portingAssistantPortingConfiguration.PortingAssistantMetrics["Description"].ToString(),
              LogsPath = metricsFolder,
              LogFilePath = Path.Combine(metricsFolder, $"portingAssistant-telemetry-{DateTime.Today.ToString("yyyyMMdd")}.log"),
              MetricsFilePath = Path.Combine(metricsFolder, $"portingAssistant-telemetry-{DateTime.Today.ToString("yyyyMMdd")}.metrics"),
              Suffix = new List<string>(){".log", ".metrics"},
              Prefix = portingAssistantPortingConfiguration.PortingAssistantMetrics["Prefix"].ToString()
            };


            LogWatcher logWatcher = new LogWatcher(teleConfig, profile);
            logWatcher.Start();
        }

      private class PortingAssistantPortingConfiguration
        {
            public PortingAssistantConfiguration PortingAssistantConfiguration { get; set; }
            public Dictionary<string, object> PortingAssistantMetrics { get; set; }
        }

    }
}