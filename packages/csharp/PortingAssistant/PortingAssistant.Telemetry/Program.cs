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
            // var telemetryConfiguration = JsonSerializer.Deserialize<TelemetryConfiguration>(File.ReadAllText(config));
            string metricsFolder = Path.Combine(userData, "logs");
            //string metricsFolder = "/Users/anirdave/testlogs/logs";
            TelemetryConfiguration teleConfig = new TelemetryConfiguration{
              InvokeUrl = portingAssistantPortingConfiguration.PortingAssistantMetrics["InvokeUrl"].ToString(),
              Region = portingAssistantPortingConfiguration.PortingAssistantMetrics["Region"].ToString(),
              ServiceName = portingAssistantPortingConfiguration.PortingAssistantMetrics["ServiceName"].ToString(),
              LogsPath = metricsFolder,
              Description = "test-description",
              LogFilePath = Path.Combine(metricsFolder, "portingAssistant-telemetry-test.log"),
              MetricsFilePath = Path.Combine(metricsFolder, $"portingAssistant-telemetry-test.metrics"),
              Suffix = new List<string>(){".log", ".metrics"},
              Prefix = "ad-test-8"
            };
            // {DateTime.Today.ToString("yyyyMMdd")}

            var outputTemplate = "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}";
            var logConfiguration = new LoggerConfiguration().Enrich.FromLogContext()
            .MinimumLevel.Warning()
            .WriteTo.File(
                teleConfig.LogFilePath,
                outputTemplate: outputTemplate);
            Log.Logger = logConfiguration.CreateLogger();

            // TelemetryCollector.Builder(Log.Logger, teleConfig.MetricsFilePath);

            // LogWatcher logWatcher =
            //     new LogWatcher(teleConfig, profile);
            // logWatcher.Start();
        }

      private class PortingAssistantPortingConfiguration
        {
            public PortingAssistantConfiguration PortingAssistantConfiguration { get; set; }
            public Dictionary<string, object> PortingAssistantMetrics { get; set; }
        }

    }
}