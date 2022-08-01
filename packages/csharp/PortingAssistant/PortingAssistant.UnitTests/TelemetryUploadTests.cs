using System;
using System.IO;
using NUnit.Framework;
using PortingAssistant.Telemetry.Utils;
using PortingAssistantExtensionTelemetry.Model;
using Serilog;

namespace PortingAssistant.UnitTests
{
    public class TelemetryUploadTests
    {
        [Test]
        public void TestLogUploadUtilGetName()
        {
            var roamingFolder = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var logs = Path.Combine(roamingFolder, "Porting Assistant for .NET", "logs");
            var config = new TelemetryConfiguration
            {
                InvokeUrl = "https://localhost",
                Region = "us-east-1",
                ServiceName = "encore",
                Description = "Porting Assistant for .NET Telemetry Logs",
                LogsPath = logs
            };

            var outputTemplate = "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}";
            var logConfiguration = new LoggerConfiguration()
                .WriteTo.Debug(outputTemplate: outputTemplate)
                .MinimumLevel.Debug();
            Log.Logger = logConfiguration.CreateLogger();
            LogUploadUtils.InitializeUploader(true, config, "default", false, Log.Logger);
            Assert.AreEqual("portingAssistant-backend-logs", LogUploadUtils.Uploader.GetLogName("portingAssistant-backend-20220801.log"));
            Assert.AreEqual("portingAssistant-metrics", LogUploadUtils.Uploader.GetLogName("portingAssistant-telemetry-20220801.metrics"));
            Assert.AreEqual("electron-logs", LogUploadUtils.Uploader.GetLogName("portingAssistant-electron-2022-08-01.log"));
            Assert.AreEqual("react-errors", LogUploadUtils.Uploader.GetLogName("portingAssistant-react-2022-08-01.log"));

        }
    }
}
