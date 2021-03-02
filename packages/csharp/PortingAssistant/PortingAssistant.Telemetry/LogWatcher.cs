using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text;
using Amazon.Runtime;
using Amazon.Runtime.CredentialManagement;
using Aws4RequestSigner;
using ElectronCgi.DotNet;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;

namespace PortingAssistant.Telemetry
{
    class LogWatcher
    {
        private Connection _connection;
        private Program.TelemetryConfiguration telemetryConfiguration;
        private string profile;
        private string userData;
        private string serviceDescription;

        public LogWatcher
            (
            Program.TelemetryConfiguration telemetryConfiguration,
            string profile,
            string userData
            )
        {
            _connection = new ConnectionBuilder().WithLogging().Build();
            Log.Logger = new LoggerConfiguration().CreateLogger();

            this.telemetryConfiguration = telemetryConfiguration;
            this.userData = userData;
            this.profile = profile;
        }

        public void Start()
        {
            try
            {
                var fileSystemWatcher = new FileSystemWatcher();

                fileSystemWatcher.Changed += (s, e)
                    => FileSystemWatcher_Changed(s, e, telemetryConfiguration, userData, profile);
                fileSystemWatcher.Created += (s, e)
                    => FileSystemWatcher_Changed(s, e, telemetryConfiguration, userData, profile);
                fileSystemWatcher.Deleted += (s, e)
                    => FileSystemWatcher_Deleted(s, e, telemetryConfiguration, userData);

                fileSystemWatcher.Path = Path.Combine(userData, telemetryConfiguration.LogsPath);

                fileSystemWatcher.EnableRaisingEvents = true;

                _connection.Listen();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Connection Ended.");
            }
            finally
            {
                Log.CloseAndFlush();
            }

        }

        private void FileSystemWatcher_Changed
            (
            object sender,
            FileSystemEventArgs e,
            Program.TelemetryConfiguration telemetryConfiguration,
            string userData,
            string profile
            )
        {
            if (!Path.GetExtension(e.FullPath).Equals(".log")) return;

            const string LastReadTokenFileName = "lastToken.json";

            FileInfo fileInfo = new FileInfo(e.FullPath);
            var fileName = e.Name;

            // Json File to record last read log token (line number).
            var lastReadTokenFile = Path.Combine(userData, telemetryConfiguration.LogsPath, LastReadTokenFileName);
            var initLineNumber = 0;
            Dictionary<string, int> fileLineNumberMap;

            var logs = new ArrayList();

            if (!IsFileLocked(fileInfo))
            {
                if (File.Exists(lastReadTokenFile))
                {
                    fileLineNumberMap = JsonConvert.DeserializeObject<Dictionary<string, int>>(File.ReadAllText(lastReadTokenFile));
                    initLineNumber = fileLineNumberMap.ContainsKey(fileName) ? fileLineNumberMap[fileName] : 0;
                }
                else
                {
                    fileLineNumberMap = new Dictionary<string, int>();
                    initLineNumber = 0;
                }

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
                        }

                        fileLineNumberMap[fileName] = currLineNumber;
                        string jsonString = JsonConvert.SerializeObject(fileLineNumberMap);
                        File.WriteAllText(lastReadTokenFile, jsonString);

                        PublishLogs(logs, profile, telemetryConfiguration);
                    }
                }
            }
            else
            {
                Log.Information("File Locked");
            }
        }

        private void FileSystemWatcher_Deleted
            (
            Object sender,
            FileSystemEventArgs e,
            Program.TelemetryConfiguration telemetryConfiguration,
            string userData
            )
        {
            if (!Path.GetExtension(e.FullPath).Equals(".log")) return;

            FileInfo fileInfo = new FileInfo(e.FullPath);
            var fileName = e.Name;

            const string LastReadTokenFileName = "lastToken.json";
            var lastReadTokenFile = Path.Combine(userData, telemetryConfiguration.LogsPath, LastReadTokenFileName);

            Dictionary<string, int> fileLineNumberMap;

            // If log file is deleted set Last Read Line Number to 0.
            if (File.Exists(lastReadTokenFile))
            {
                fileLineNumberMap = JsonConvert.DeserializeObject<Dictionary<string, int>>(File.ReadAllText(lastReadTokenFile));
                if (fileLineNumberMap.ContainsKey(fileName)) fileLineNumberMap[fileName] = 0;
            }
        }
        private static void PublishLogs
            (
            ArrayList logs,
            string profile,
            Program.TelemetryConfiguration telemetryConfiguration
            )
        {
            Dictionary<string, ArrayList> logTypeMap = new Dictionary<string, ArrayList>();

            foreach (string log in logs)
            {
                var jsonObj = JObject.Parse(log);
                var content = jsonObj["Content"].ToString(Formatting.None);
                var type = jsonObj["Type"].ToString();

                if (!logTypeMap.ContainsKey(type)) logTypeMap[type] = new ArrayList();
                logTypeMap[type].Add(content);
            }

            foreach (KeyValuePair<string, ArrayList> entry in logTypeMap)
            {
                PutLogData(entry.Key, JsonConvert.SerializeObject(entry.Value), profile, telemetryConfiguration);
            }
        }

        private static async void PutLogData
            (
            string logName,
            string logData,
            string profile,
            Program.TelemetryConfiguration telemetryConfiguration
            )
        {
            const string PathTemplate = "/put-log-data";

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

                var client = new HttpClient();

                var response = await client.SendAsync(request);

                await response.Content.ReadAsStringAsync();
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
    }
}
