using Amazon;
using Amazon.Runtime.CredentialManagement;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using System;
using System.Threading.Tasks;
using System.IO;

namespace PortingAssistant.Common.S3Upload
{
    public class S3Upload {
        private IAmazonS3 client;
        private string bucketName;

        public S3Upload(RegionEndpoint bucketRegion, string bucketName, string accessKey, string secret) {
            this.bucketName = bucketName;
            
            AWSCredentials credentials;
            var sharedFile = new SharedCredentialsFile();
            CredentialProfileOptions options = new CredentialProfileOptions();
            options.AccessKey = accessKey;
            options.SecretKey = secret;
            AWSCredentialsFactory.TryGetAWSCredentials(options, sharedFile, out credentials);
            this.client = new AmazonS3Client(credentials, bucketRegion);
        }
        
        public bool uploadObjWithString(string keyName, string contents) {
            try {
              var resp = uploadObjString(keyName, contents);
              var resp2 = uploadObjFile(keyName);
              var other = resp.Result;
              var other2 = resp2.Result;
              if ((other.HttpStatusCode != System.Net.HttpStatusCode.OK) && other2.HttpStatusCode != System.Net.HttpStatusCode.OK) {
                return false;
              }
            } catch {
              return false;
            }
            return true;
        }

        private async Task<PutObjectResponse> uploadObjString(string keyName, string contents) {
            string uploadName = keyName + "/" + "metadata";
            var putRequest = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = uploadName,
                ContentBody = contents
            };

            PutObjectResponse response = await client.PutObjectAsync(putRequest);
            return response;
        }


        private async Task<PutObjectResponse> uploadObjFile(string keyName)
        {
          var AppDataFolderPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
          var portingAssistantLogPath = @"Porting Assistant for .NET\logs\main.log";
          string logdirectoryPath = Path.Combine(AppDataFolderPath, portingAssistantLogPath);
            string uploadName = keyName + "/" + "log";
            var putRequest2 = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = uploadName,
                FilePath = logdirectoryPath,
                ContentType = "text/plain"
            };
            putRequest2.Metadata.Add("x-amz-meta-title", "someTitle");
            PutObjectResponse response = await client.PutObjectAsync(putRequest2);
            return response;
        }

    }
}