using Amazon.Runtime;
using Amazon.Runtime.CredentialManagement;
using Aws4RequestSigner;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PortingAssistantExtensionTelemetry.Model;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace PortingAssistant.Telemetry.Utils
{
    public static class LogUploadUtils
    {
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

        public static void OnTimedEvent(Object source, System.Timers.ElapsedEventArgs e, TelemetryConfiguration teleConfig, string lastReadTokenFile, HttpClient client, string profile, string prefix)
        {
            try
            {
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
                foreach (var file in fileEntries)
                {
                    var fName = Path.GetFileNameWithoutExtension(file);
                    var fileExtension = Path.GetExtension(file);
                    var logName = prefix;

                    // Check which type of log file and set the prefix
                    if (fName == "main")
                    {
                        continue;
                    }
                    else
                    {
                        string typeOfLog = fName.Split('-')[1];
                        if (typeOfLog == "assessment")
                        {
                            continue;
                        }
                        else if (typeOfLog == "telemetry")
                        {
                            logName = "portingAssistant-metrics";
                        }
                        else if (typeOfLog == "backend")
                        {
                            logName = "portingAssistant-backend-logs";
                        }
                        else if (typeOfLog == "electron")
                        {
                            logName = "electron-logs";
                        }
                        else if (typeOfLog == "react")
                        {
                            logName = "react-errors";
                        }
                        else if (typeOfLog == "client")
                        {
                            var suffix = Path.GetExtension(file);
                            logName = suffix == ".log" ? "portingAssistant-client-cli-logs" : "portingAssistant-client-cli-metrics";
                        }
                    }

                    var logs = new ArrayList();

                    // Add new files to fileLineNumberMap
                    if (!fileLineNumberMap.ContainsKey(file))
                    {
                        fileLineNumberMap[file] = 0;
                    }
                    initLineNumber = fileLineNumberMap[file];
                    FileInfo fileInfo = new FileInfo(file);
                    var success = false;
                    if (!IsFileLocked(fileInfo))
                    {
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

                                // If put-log api works keep sending logs else wait and do it next time
                                while (line != null && logs.Count <= 1000)
                                {
                                    currLineNumber++;
                                    logs.Add(line);
                                    line = reader.ReadLine();

                                    // send 1000 lines of logs each time when there are large files
                                    if (logs.Count >= 1000)
                                    {
                                        // logs.TrimToSize();
                                        success = PutLogData(client, logName, JsonConvert.SerializeObject(logs), profile, teleConfig).Result;
                                        if (success) { logs = new ArrayList(); };
                                    }
                                }

                                if (logs.Count != 0)
                                {
                                    success = PutLogData(client, logName, JsonConvert.SerializeObject(logs), profile, teleConfig).Result;
                                }
                                if (success)
                                {
                                    fileLineNumberMap[file] = currLineNumber;
                                    string jsonString = JsonConvert.SerializeObject(fileLineNumberMap);
                                    File.WriteAllText(lastReadTokenFile, jsonString);
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }
    }
}