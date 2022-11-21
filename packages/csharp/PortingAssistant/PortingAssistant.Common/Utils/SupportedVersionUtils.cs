using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using PortingAssistant.Common.Model;

namespace PortingAssistant.Common.Utils
{
    public static class SupportedVersionUtils
    {
        public static async Task<(List<SupportedVersion>, string)> GetSupportedConfigurationAsync(
            AmazonS3Client s3Client,
            string bucketName,
            string s3FileName,
            string bucketOwnerId,
            ILogger logger)
        {
            SupportedVersionConfiguration result = SupportedVersionConfiguration.GetDefaultConfiguration();
            string errorMessage = string.Empty;
            try
            {
                GetObjectRequest request = new GetObjectRequest()
                {
                    BucketName = bucketName,
                    Key = s3FileName,
                    ExpectedBucketOwner = bucketOwnerId,
                };
                var response = await s3Client.GetObjectAsync(request);
                using (var streamReader = new StreamReader(response.ResponseStream))
                {
                    result = JsonConvert.DeserializeObject<SupportedVersionConfiguration>(await streamReader.ReadToEndAsync());
                }

                // Make sure to sort the version items before presenting to the UI.
                result.Versions.Sort();
            }
            catch (AmazonS3Exception s3Exception)
            {
                if (s3Exception.StatusCode != HttpStatusCode.NotFound)
                {
                    errorMessage = $"Porting Assistant failed to configure supported versions. " +
                        $"Please verify your internect connection and restart Porting Assistant. {s3Exception.StatusCode}";
                    logger.LogDebug(
                        exception: s3Exception,
                        message: errorMessage);
                }
                else
                {
                    errorMessage = $"The supported version configuration file is not availabe. " +
                        $"Please reach out to aws-porting-assistant-support@amazon.com for support. {s3Exception.StatusCode}";
                    logger.LogDebug(
                        exception: s3Exception,
                        message: errorMessage);
                }
            }
            catch (Exception ex)
            {
                errorMessage = $"Porting Assistant failed to configure supported versions. " +
                    $"Please verify your internect connection and restart Porting Assistant. \n{ex.Message}";
                logger.LogError(
                    exception: ex,
                    message: errorMessage);
            }

            return (result.Versions, errorMessage);
        }
    }
}
