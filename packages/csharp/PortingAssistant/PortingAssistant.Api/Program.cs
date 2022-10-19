using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text.Json;
using PortingAssistant.Common.Model;
using PortingAssistant.Common.Services;
using PortingAssistant.Common.Utils;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Client;
using PortingAssistant.Client.Model;
using Serilog;
using PortingAssistant.VisualStudio;
using PortingAssistantExtensionTelemetry.Model;
using PortingAssistantExtensionTelemetry;

namespace PortingAssistant.Api
{
    class Program
    {
        static void Main(string[] args)
        {
          try {
            
            if (args.Length < 3)
            {
                throw new ArgumentException("Must provide a config file, aws profile and path");
            }
            var config = args[0];
            var isConsole = args.Length == 5 && args[3].Equals("--console");

            var outputTemplate = "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}";
            if (args.Length == 6 && !args[3].Equals("--console"))
            {
                // Args[3] is version number if not --console
                outputTemplate = "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] (" + args[3] + ") {SourceContext}: {Message:lj}{NewLine}{Exception}";
                Telemetry.Model.MetricsBase.Version = args[3];
                Telemetry.Model.MetricsBase.UsingDefault = System.Convert.ToBoolean(args[4]);
                Telemetry.Model.MetricsBase.SessionId = args[5];
            }

            Serilog.Formatting.Display.MessageTemplateTextFormatter tf =
                new Serilog.Formatting.Display.MessageTemplateTextFormatter(outputTemplate, CultureInfo.InvariantCulture);

            var date = DateTime.Today.ToString("yyyy-MM-dd");
            var logConfiguration = new LoggerConfiguration().Enrich.FromLogContext()
                .MinimumLevel.Debug()
                .WriteTo.RollingFile(
                    Path.Combine(args[2], "logs", "portingAssistant-assessment-{Date}.log"),
                    outputTemplate: outputTemplate,
                    fileSizeLimitBytes: 1000000)
                .WriteTo.Logger(lc => lc.MinimumLevel.Error().WriteTo.RollingFile(
                    Path.Combine(args[2], "logs", "portingAssistant-backend-{Date}.log"),
                    outputTemplate: outputTemplate,
                    fileSizeLimitBytes: 1000000));

            if (isConsole)
            {
                logConfiguration = logConfiguration.WriteTo.Console();
            }

            Log.Logger = logConfiguration.CreateLogger();
            Log.Logger.Error("Release Debug || Received Args: " + string.Join("\n", args));

            var portingAssistantPortingConfiguration = JsonSerializer.Deserialize<PortingAssistantPortingConfiguration>(File.ReadAllText(config));
            var configuration = new PortingAssistantConfiguration();
            configuration.DataStoreSettings.HttpsEndpoint = portingAssistantPortingConfiguration.PortingAssistantConfiguration.DataStoreSettings.HttpsEndpoint;
            configuration.DataStoreSettings.S3Endpoint = portingAssistantPortingConfiguration.PortingAssistantConfiguration.DataStoreSettings.S3Endpoint;
            configuration.DataStoreSettings.GitHubEndpoint = portingAssistantPortingConfiguration.PortingAssistantConfiguration.DataStoreSettings.GitHubEndpoint;

            Log.Logger.Error("Release Debug || Configuration Read" + Newtonsoft.Json.JsonConvert.SerializeObject(configuration, Newtonsoft.Json.Formatting.Indented));

            var contributionConfiguration = new CustomerContributionConfiguration();
            contributionConfiguration.CustomerFeedbackEndpoint = portingAssistantPortingConfiguration.CustomerContributionConfiguration.CustomerFeedbackEndpoint;
            contributionConfiguration.RuleContributionEndpoint = portingAssistantPortingConfiguration.CustomerContributionConfiguration.RuleContributionEndpoint;
            
            Log.Logger.Error("Release Debug || contributionConfiguration" + contributionConfiguration.ToString());
            
            string metricsFolder = Path.Combine(args[2], "logs");
            string metricsFilePath = Path.Combine(metricsFolder, $"portingAssistant-telemetry-{DateTime.Today.ToString("yyyyMMdd")}.metrics");


            var telemetryLogConfiguration = new LoggerConfiguration().Enrich.FromLogContext()
                .MinimumLevel.Debug()
                .WriteTo.RollingFile(
                    Path.Combine(args[2], "logs", "portingAssistantTelemetry.log"),
                    outputTemplate: outputTemplate);
            TelemetryCollector.Builder(telemetryLogConfiguration.CreateLogger(), metricsFilePath);

            Log.Logger.Error("Release Debug || telemetryLogConfiguration" + telemetryLogConfiguration.ToString());

            var crashReportsDir = Path.Combine(metricsFolder, "reports");
            Log.Logger.Error("Release Debug || crashReportsDir" + crashReportsDir.ToString());

            try
            {
            if (Directory.Exists(crashReportsDir)) {
              string[] files = Directory.GetFiles(crashReportsDir);
              for (int i = 0; i < files.Length; i++)
              {
                FileInfo file = new FileInfo(files[0]);
                if ((file.CreationTime - DateTime.Now).TotalDays < 30) {
                  TelemetryCollectionUtils.CollectCrashMetrics(file.Name, file.CreationTimeUtc);
                }
              }
            }
            } catch (Exception ex) {
              Log.Logger.Error("Error in reading crash reports: ", ex);
            }


            Log.Logger.Error("Release Debug || Configuring Services");
            var serviceCollection = new ServiceCollection();
            ConfigureServices(serviceCollection, configuration);
            Log.Logger.Error("Release Debug || Configured Services");
            try
            {
                var application = new Application(serviceCollection, contributionConfiguration);
                Log.Logger.Error("Release Debug || Application created");
                application.SetupConnection(isConsole);
                Log.Logger.Error("Release Debug || Starting application");
                application.Start();
                Log.Logger.Error("Release Debug || Application Started");
            } catch (Exception ex) {
                Log.Logger.Error("Error in starting application: ", ex);
            }
            finally
            {
                Log.CloseAndFlush();
            }
          } catch (Exception ex) {
            Log.Logger.Error("Error", ex);
          }
        }

        static private void ConfigureServices(IServiceCollection serviceCollection, PortingAssistantConfiguration config)
        {
            serviceCollection.AddLogging(loggingBuilder => loggingBuilder
                .SetMinimumLevel(LogLevel.Debug)
                .AddSerilog(logger: Log.Logger, dispose: true));
            serviceCollection.AddTransient<IAssessmentService, AssessmentService>();
            serviceCollection.AddTransient<IPortingService, PortingService>();
            serviceCollection.AddSingleton<IVisualStudioFinder, VisualStudioFinder>();
            serviceCollection.AddAssessment(config);
            serviceCollection.AddOptions();
        }

        private class PortingAssistantPortingConfiguration
        {
            public PortingAssistantConfiguration PortingAssistantConfiguration { get; set; }
            public Dictionary<string, object> PortingAssistantMetrics { get; set; }
            public CustomerContributionConfiguration CustomerContributionConfiguration { get; set; }
        }
    }
}
