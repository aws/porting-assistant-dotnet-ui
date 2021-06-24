using System;
using Serilog;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;
using PortingAssistant.Client.Model;
using ElectronCgi.DotNet;
using PortingAssistantExtensionTelemetry;
using PortingAssistantExtensionTelemetry.Model;

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

            Connection _connection = new ConnectionBuilder().WithLogging().Build();
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
              Suffix = new List<string>(){".log", ".metrics"}
            };

            string prefix = portingAssistantPortingConfiguration.PortingAssistantMetrics["Prefix"].ToString();
            LogWatcher logWatcher = new LogWatcher(teleConfig, profile, prefix);
            logWatcher.Start();
            _connection.Listen();
        }

      private class PortingAssistantPortingConfiguration
        {
            public PortingAssistantConfiguration PortingAssistantConfiguration { get; set; }
            public Dictionary<string, object> PortingAssistantMetrics { get; set; }
        }

    }
}