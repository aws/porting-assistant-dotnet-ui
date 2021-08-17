using Amazon;
using Amazon.Runtime.CredentialManagement;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using System;
using System.Threading.Tasks;

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
              var other = resp.Result;
              if (other.HttpStatusCode != System.Net.HttpStatusCode.OK) {
                return false;
              }
            } catch {
              return false;
            }
            return true;
        }

        private async Task<PutObjectResponse> uploadObjString(string keyName, string contents) {
            var putRequest = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = keyName,
                ContentBody = contents
            };

            PutObjectResponse response = await client.PutObjectAsync(putRequest);
            return response;
        }
    }
}
