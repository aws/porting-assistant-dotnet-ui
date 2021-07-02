using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text.Json;
using PortingAssistant.Common.Model;
using PortingAssistant.Common.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PortingAssistant.Client.Client;
using PortingAssistant.Client.Model;
using Serilog;
using PortingAssistant.VisualStudio;

namespace PortingAssistant.Api
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length < 3)
            {
                throw new ArgumentException("Must provide a config file, aws profile and path");
            }
            var config = args[0];
            var isConsole = args.Length == 4 && args[3].Equals("--console");

            var outputTemplate = "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}";
            if (args.Length == 4 && !args[3].Equals("--console"))
            {
                // Args[3] is version number if not --console
                outputTemplate = "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] (" + args[3] + ") {SourceContext}: {Message:lj}{NewLine}{Exception}";
            }

            Serilog.Formatting.Display.MessageTemplateTextFormatter tf =
                new Serilog.Formatting.Display.MessageTemplateTextFormatter(outputTemplate, CultureInfo.InvariantCulture);

            var portingAssistantSink = new PortingAssistantSink(tf);
            var logConfiguration = new LoggerConfiguration().Enrich.FromLogContext()
                .MinimumLevel.Debug()
                .WriteTo.RollingFile(
                    Path.Combine(args[2], "logs", "portingAssistant-assessment-{Date}.log"),
                    outputTemplate: outputTemplate)
                .WriteTo.Sink(portingAssistantSink);

            if (isConsole)
            {
                logConfiguration = logConfiguration.WriteTo.Console();
            }

            Log.Logger = logConfiguration.CreateLogger();

            var portingAssistantPortingConfiguration = JsonSerializer.Deserialize<PortingAssistantPortingConfiguration>(File.ReadAllText(config));
            var configuration = new PortingAssistantConfiguration();
            configuration.DataStoreSettings.HttpsEndpoint = portingAssistantPortingConfiguration.PortingAssistantConfiguration.DataStoreSettings.HttpsEndpoint;
            configuration.DataStoreSettings.S3Endpoint = portingAssistantPortingConfiguration.PortingAssistantConfiguration.DataStoreSettings.S3Endpoint;
            configuration.DataStoreSettings.GitHubEndpoint = portingAssistantPortingConfiguration.PortingAssistantConfiguration.DataStoreSettings.GitHubEndpoint;

            var serviceCollection = new ServiceCollection();
            ConfigureServices(serviceCollection, configuration);

            try
            {
                var application = new Application(serviceCollection, portingAssistantSink);
                application.SetupConnection(isConsole);
                application.Start();
            }
            finally
            {
                Log.CloseAndFlush();
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
        }
    }
}
