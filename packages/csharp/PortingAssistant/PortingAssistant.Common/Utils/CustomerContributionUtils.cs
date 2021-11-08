using PortingAssistant.Common.Model;
using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.IO;

namespace PortingAssistant.Common.Utils
{
    public static class CustomerContributionUtils
    {
        public static Response<bool, string> FeedbackUpload(string path, string contents, string endPoint)
        {
            try 
            {
                var client = new HttpClient();
                string metadataPath = path + "/" + "metadata";
                var metaUploadResponse = ContentsUpload(client, endPoint, metadataPath, new StringContent(contents)).Result;
                var logUploadResponse = LogUpload(client, path, endPoint);
                Response<bool, string> response;
                if (metaUploadResponse.status && logUploadResponse.status)
                {
                   response = new Response<bool, string>
                   {
                       Status = Response<bool, string>.Success(),
                       Value = true
                   };
                }
                else
                {
                    string msgResponse = string.Format("metadata:{0}\nmain.log:{1}", metaUploadResponse.msg, logUploadResponse.msg);
                    response = new Response<bool, string>
                    {
                        Status = Response<bool, string>.Failed(new Exception(msgResponse)),
                        ErrorValue = msgResponse
                    };
                }
                return response;
            }
            catch (Exception ex)
            {
                return new Response<bool, string>
                {
                    Status = Response<bool, string>.Failed(ex),
                    ErrorValue = ex.Message
                };
            }
        }

        public static Response<bool, string> RuleContributionUpload(string path, string contents, string endpoint)
        {
            try
            {
                var client = new HttpClient();
                var metaUploadResponse = ContentsUpload(client, endpoint, path, new StringContent(contents)).Result;
                Response<bool, string> response;
                if (metaUploadResponse.status)
                {
                    response = new Response<bool, string>
                    {
                        Status = Response<bool, string>.Success(),
                        Value = true
                    };
                }
                else
                {
                    string msgResponse = string.Format("ContributionData:{0}", metaUploadResponse.msg);
                    response = new Response<bool, string>
                    {
                        Status = Response<bool, string>.Failed(new Exception(msgResponse)),
                        ErrorValue = msgResponse
                    };
                }
                return response;
            }
            catch (Exception ex)
            {
                return new Response<bool, string>
                {
                    Status = Response<bool, string>.Failed(ex),
                    ErrorValue = ex.Message
                };
            }
        }

        private static async Task<(bool status, string msg)> ContentsUpload(HttpClient client, string endPoint, string uploadName, HttpContent contents)
        {
            try
            {
                var apiResponse = await client.PutAsync($"{endPoint}/s3?key={uploadName}", contents);
                string msgResponse = await apiResponse.Content.ReadAsStringAsync();
                var response = (status:apiResponse.IsSuccessStatusCode, msg:msgResponse);
                return response;
            }
            catch (Exception ex)
            {
                return (status:false, msg:ex.Message);
            }
        }

        private static (bool status, string msg) LogUpload(HttpClient client, string keyName, string endPoint)
        {
            try
            {
                var AppDataFolderPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                var portingAssistantLogPath = @"Porting Assistant for .NET\logs\main.log";
                string logdirectoryPath = Path.Combine(AppDataFolderPath, portingAssistantLogPath);
                string uploadName = keyName + "/" + "log";

                var content = new MultipartFormDataContent();
                var fileContent = new StreamContent(File.OpenRead(logdirectoryPath));
                fileContent.Headers.Add("Content-Type", "plain/text");
                fileContent.Headers.Add("Content-Disposition", "form-data; name=\"file\"; filename=\"" + Path.GetFileName(logdirectoryPath) + "\"");
                content.Add(fileContent);

                return ContentsUpload(client, endPoint, uploadName, content).Result;
            }
            catch (Exception ex)
            {
                return (status: false, msg: ex.Message);
            }
        }
    }
}