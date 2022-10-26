using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using PortingAssistant.Client.Common.Model;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace PortingAssistant.Common.Utils
{
    public static class SupportedVersionUtils
    {
        public static async Task<List<SupportedVersion>> GetSupportedConfiguration(
            string s3FileUrl,
            ILogger logger)
        {
            SupportedVersionConfiguration result = SupportedVersionConfiguration.CreateDefaultConfiguration();
            try
            {
                using (var httpClient = new HttpClient())
                {
                    using var stream = await httpClient.GetStreamAsync(s3FileUrl);
                    var streamReader = new StreamReader(stream);
                    result = JsonConvert.DeserializeObject<SupportedVersionConfiguration>(await streamReader.ReadToEndAsync());
                }
                // Make sure to sort the version items before presenting to the UI.
                result.Versions.Sort();
            }
            catch (Exception ex)   // When failed to read from S3 config file, fall back to default supported versions.
            {
                logger.LogDebug(ex, $"Failed to read supported versions from {s3FileUrl}, using default supported versions.");
            }

            return result.Versions;
        }
    }
}
