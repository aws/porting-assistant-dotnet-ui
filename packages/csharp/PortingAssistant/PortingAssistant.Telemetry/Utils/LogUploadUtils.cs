using Amazon.Runtime;
using Amazon.Runtime.CredentialManagement;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PortingAssistantExtensionTelemetry.Model;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;
using PortingAssistant.Client.Telemetry;
using Amazon;

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
            string logName,
            string logData,
            string profile,
            bool enabledDefaultCredentials,
            TelemetryConfiguration telemetryConfiguration
            )
        {
            const string PathTemplate = "/put-log-data";
            try
            {
                var chain = new CredentialProfileStoreChain();
                AWSCredentials awsCredentials;
                if (enabledDefaultCredentials)
                {
                    awsCredentials = FallbackCredentialsFactory.GetCredentials();
                    if (awsCredentials == null)
                    {
                        Console.WriteLine("Invalid Credentials.");
                        return false;
                    }
                }
                else {
                    var profileName = profile;
                    if (!chain.TryGetAWSCredentials(profileName, out awsCredentials))
                    {
                        Console.WriteLine("Invalid Credentials.");
                        return false;
                    }
                }
                var region = telemetryConfiguration.Region;
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

                  var config = new TelemetryClientConfig
                  {
                      RegionEndpoint = RegionEndpoint.GetBySystemName(region),
                      MaxErrorRetry = 2,
                      ServiceURL = telemetryConfiguration.InvokeUrl,
                  };
                  var client = new TelemetryClient(awsCredentials, config);
                  var contentString = await requestContent.ReadAsStringAsync();
                  var telemetryRequest = new TelemetryRequest(telemetryConfiguration.ServiceName, contentString);
                  var telemetryResponse = await client.SendAsync(telemetryRequest);
                  if (telemetryResponse.HttpStatusCode != HttpStatusCode.OK)
                  {
                      Console.WriteLine("Http response failed with status code: " + telemetryResponse.HttpStatusCode.ToString());
                  }
                  
                  return telemetryResponse.HttpStatusCode == HttpStatusCode.OK;
             }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return false;
            }
        }

        public static void OnTimedEvent(
            Object source, 
            System.Timers.ElapsedEventArgs e, 
            TelemetryConfiguration teleConfig, 
            string lastReadTokenFile, 
            string profile, 
            bool enabledDefaultCredentials,
            string prefix,
            bool shareMetric)
        {
            try
            {
                if (!shareMetric) return;
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

                        string typeOfLog = (fName.Split('-').Length > 1) ? fName.Split('-')[1]: String.Empty;
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
                                        success = PutLogData(logName, JsonConvert.SerializeObject(logs), profile, enabledDefaultCredentials, teleConfig).Result;
                                        if (success) { logs = new ArrayList(); };
                                    }
                                }

                                if (logs.Count != 0)
                                {
                                    success = PutLogData(logName, JsonConvert.SerializeObject(logs), profile, enabledDefaultCredentials, teleConfig).Result;
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

        public static string getUniqueIdentifier()
        {
            string _uniqueId;
            string DefaultIdentifier = "591E6A97031144D5BADCE980EE3E51B7";
            var networkInterfaces = NetworkInterface.GetAllNetworkInterfaces()
                .Where(nic => nic.NetworkInterfaceType != NetworkInterfaceType.Loopback
                                && (nic.NetworkInterfaceType == NetworkInterfaceType.Wireless80211 || nic.NetworkInterfaceType == NetworkInterfaceType.Ethernet)
                                && nic.Speed > 0).ToList();
            // wifi network interface will always take higher precedence for retrieving physical address
            var wifiNetworkInterface = networkInterfaces.FirstOrDefault(wi => wi.NetworkInterfaceType == NetworkInterfaceType.Wireless80211);
            if (wifiNetworkInterface != null)
            {
                _uniqueId = CryptoUtil.HashString(wifiNetworkInterface.GetPhysicalAddress().ToString());
            }
            else
            {
                var ethernetInterface = networkInterfaces.LastOrDefault(ei => 
                    ei.NetworkInterfaceType == NetworkInterfaceType.Ethernet
                    && ei.OperationalStatus == OperationalStatus.Up 
                    && !ei.Name.Contains("Bluetooth", StringComparison.OrdinalIgnoreCase));

                _uniqueId = ethernetInterface != null 
                    ? CryptoUtil.HashString(ethernetInterface.GetPhysicalAddress().ToString()) 
                    : DefaultIdentifier;
            }
            return _uniqueId;
        }
    }
}