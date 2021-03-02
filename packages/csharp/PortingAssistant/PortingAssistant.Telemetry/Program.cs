using System;
using System.IO;
using System.Text.Json;

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

            var telemetryConfiguration = JsonSerializer.Deserialize<TelemetryConfiguration>(File.ReadAllText(config));

            LogWatcher logWatcher =
                new LogWatcher(telemetryConfiguration, profile, userData);
            logWatcher.Start();
        }

        public class TelemetryConfiguration
        {
            public string InvokeUrl { get; set; }
            public string Region { get; set; }
            public string LogsPath { get; set; }
            public string ServiceName { get; set; }
            public string Description { get; set; }
        }
    }
}
