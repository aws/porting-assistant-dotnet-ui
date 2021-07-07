using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections;
using System.Net.Http;
using System.Collections.Generic;
using PortingAssistant.Client.Model;
using ElectronCgi.DotNet;
using Amazon.Runtime;
using Amazon.Runtime.CredentialManagement;
using Aws4RequestSigner;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PortingAssistantExtensionTelemetry;
using PortingAssistantExtensionTelemetry.Model;
using System.Threading.Tasks;

namespace PortingAssistant.Telemetry
{
    class Program
    {
        // private static Timer logTimer;
        // private readonly string lastReadTokenFile;
        // private readonly HttpClient client;

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
            var portingAssistantPortingConfiguration = System.Text.Json.JsonSerializer.Deserialize<PortingAssistantPortingConfiguration>(File.ReadAllText(config));
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
            var lastReadTokenFile = Path.Combine(teleConfig.LogsPath, "lastToken.json");
            string prefix = portingAssistantPortingConfiguration.PortingAssistantMetrics["Prefix"].ToString();
            var client = new HttpClient();

            // Create a timer and set an interval.
            var logTimer = new System.Timers.Timer();
            logTimer.Interval = Convert.ToDouble(portingAssistantPortingConfiguration.PortingAssistantMetrics["LogTimerInterval"].ToString());
            // Hook up the Elapsed event for the timer. 
            // logTimer.Elapsed += OnTimedEvent;
            logTimer.Elapsed += (source, e) => OnTimedEvent(source, e, teleConfig, lastReadTokenFile, client, profile, prefix);

            // Have the timer fire repeated events (true is the default)
            logTimer.AutoReset = true;

            // Start the timer
            logTimer.Enabled = true;

            // LogWatcher logWatcher = new LogWatcher(teleConfig, profile, prefix);
            // logWatcher.Start();
            _connection.Listen();
        }

      private class PortingAssistantPortingConfiguration
        {
            public PortingAssistantConfiguration PortingAssistantConfiguration { get; set; }
            public Dictionary<string, object> PortingAssistantMetrics { get; set; }
        }
      
      private static void OnTimedEvent(Object source, System.Timers.ElapsedEventArgs e, TelemetryConfiguration teleConfig, string lastReadTokenFile, HttpClient client, string profile, string prefix )
        {
          try {
            // Get files in directory and filter based on Suffix
            string[] fileEntries = Directory.GetFiles(teleConfig.LogsPath).Where(f => (
              teleConfig.Suffix.ToArray().Any(x => f.EndsWith(x))
              )).ToArray();
            // Get or Create fileLineNumberMap
            var fileLineNumberMap = new Dictionary<string, int>();
            if (File.Exists(lastReadTokenFile))
            {
                fileLineNumberMap = JsonConvert.DeserializeObject<Dictionary<string, int>>(File.ReadAllText(lastReadTokenFile));
            }
            var initLineNumber = 0;            
            foreach (var file in fileEntries) {
              var fileExtension = Path.GetExtension(file);
              var logName = prefix + fileExtension.Trim().Substring(1);
              var logs = new ArrayList();

              // Add new files to fileLineNumberMap
              if (!fileLineNumberMap.ContainsKey(file)) {
                fileLineNumberMap[file] = 0;
              }
              initLineNumber = fileLineNumberMap[file];
              FileInfo fileInfo = new FileInfo(file);
              var success = false;
              if (!IsFileLocked(fileInfo)) {
                using (FileStream fs = fileInfo.Open(FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    using (StreamReader reader = new StreamReader(fs))
                    {
                        string line = null;
                        int currLineNumber = 0;
                        for (; currLineNumber < initLineNumber; currLineNumber++)
                        {
                            line = reader.ReadLine();
                            if (line == null)
                            {
                                return;
                            }
                        }

                        line = reader.ReadLine();

                        while (line != null)
                        {
                            currLineNumber++;
                            logs.Add(line);
                            line = reader.ReadLine();

                            // send 1000 lines of logs each time when there are large files
                            if (logs.Count >= 1000)
                            {
                                // logs.TrimToSize();
                                success = PutLogData(client, logName, JsonConvert.SerializeObject(logs), profile, teleConfig).Result;
                                if (success) {logs = new ArrayList();};
                            }
                        }

                        if (logs.Count != 0)
                        {
                            success = PutLogData(client, logName, JsonConvert.SerializeObject(logs), profile, teleConfig).Result;
                        }
                        if (success) {
                        fileLineNumberMap[file] = currLineNumber;
                        string jsonString = JsonConvert.SerializeObject(fileLineNumberMap);
                        File.WriteAllText(lastReadTokenFile, jsonString);
                        }
                    }
                }
              }
            }
          } catch (Exception ex) {
            Console.WriteLine(ex.Message);
          }
        }

        private static Boolean IsFileLocked(FileInfo file)
        {
            FileStream stream = null;

            try
            {
                stream = file.Open
                (
                    FileMode.Open,
                    FileAccess.Read,
                    FileShare.ReadWrite
                );
            }
            catch (IOException)
            {
                return true;
            }
            finally
            {
                if (stream != null)
                    stream.Close();
            }
            return false;
        }

        private static async Task<bool> PutLogData
            (
            HttpClient client,
            string logName,
            string logData,
            string profile,
            TelemetryConfiguration telemetryConfiguration
            )
        {
            const string PathTemplate = "/put-log-data";
            try
            {


                var chain = new CredentialProfileStoreChain();
                AWSCredentials awsCredentials;
                var profileName = profile;
                var region = telemetryConfiguration.Region;
                if (chain.TryGetAWSCredentials(profileName, out awsCredentials))
                {
                    var signer = new AWS4RequestSigner
                        (
                        awsCredentials.GetCredentials().AccessKey,
                        awsCredentials.GetCredentials().SecretKey
                        );

                    dynamic requestMetadata = new JObject();
                    requestMetadata.version = "1.0";
                    requestMetadata.service = telemetryConfiguration.ServiceName;
                    requestMetadata.token = "12345678";
                    requestMetadata.description = telemetryConfiguration.Description;

                    dynamic log = new JObject();
                    log.timestamp = DateTime.Now.ToString();
                    log.logName = logName;
                    var logDataInBytes = System.Text.Encoding.UTF8.GetBytes(logData);
                    log.logData = System.Convert.ToBase64String(logDataInBytes);

                    dynamic body = new JObject();
                    body.requestMetadata = requestMetadata;
                    body.log = log;

                    var requestContent = new StringContent(body.ToString(Formatting.None), Encoding.UTF8, "application/json");

                    var requestUri = new Uri(String.Join("", telemetryConfiguration.InvokeUrl, PathTemplate));

                    var request = new HttpRequestMessage
                    {
                        Method = HttpMethod.Post,
                        RequestUri = requestUri,
                        Content = requestContent
                    };

                    request = await signer.Sign(request, "execute-api", region);

                    var response = await client.SendAsync(request);

                    await response.Content.ReadAsStringAsync();
                    
                    return response.IsSuccessStatusCode;
                }
                Console.WriteLine("Invalid Credentials.");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return false;
            }
        }

    }
}