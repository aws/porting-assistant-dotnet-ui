using ElectronCgi.DotNet;
using PortingAssistant.Client.Model;
using PortingAssistant.Telemetry.Utils;
using PortingAssistantExtensionTelemetry.Model;
using System;
using System.Collections.Generic;
using System.IO;
using Serilog;

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
                LogFilePath = Path.Combine(metricsFolder, $"portingAssistant-telemetry-errors-{DateTime.Today.ToString("yyyyMMdd")}.log"),
                MetricsFilePath = Path.Combine(metricsFolder, $"portingAssistant-telemetry-{DateTime.Today.ToString("yyyyMMdd")}.metrics"),
                Suffix = new List<string>() { ".log", ".metrics" }
            };

            var outputTemplate = "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}";
            var logConfiguration = new LoggerConfiguration().Enrich.FromLogContext()
                .MinimumLevel.Debug()
                .WriteTo.RollingFile(
                    Path.Combine(teleConfig.LogFilePath),
                    outputTemplate: outputTemplate,
                    fileSizeLimitBytes: 1000000);

            Log.Logger = logConfiguration.CreateLogger();

            var logTimer = new System.Timers.Timer();
            logTimer.Interval = Convert.ToDouble(portingAssistantPortingConfiguration.PortingAssistantMetrics["LogTimerInterval"].ToString());

            LogUploadUtils.InitializeUploader(
                shareMetric,
                teleConfig,
                profile,
                useDefaultCreds,
                Log.Logger);
            logTimer.Elapsed += LogUploadUtils.OnTimedEvent;
            logTimer.AutoReset = true;
            logTimer.Enabled = true;

            var writeLogErrorsTimer = new System.Timers.Timer
            {
                Interval = 300000,
                AutoReset = true,
                Enabled = true
            };
            writeLogErrorsTimer.Elapsed += LogUploadUtils.WriteLogUploadErrors;

            _connection.Listen();
        }

        private class PortingAssistantPortingConfiguration
        {
            public PortingAssistantConfiguration PortingAssistantConfiguration { get; set; }
            public Dictionary<string, object> PortingAssistantMetrics { get; set; }
        }

    }

}