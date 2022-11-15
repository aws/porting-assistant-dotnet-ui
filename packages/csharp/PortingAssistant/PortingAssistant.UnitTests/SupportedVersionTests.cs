using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using PortingAssistant.Client.NuGet.Interfaces;
using PortingAssistant.Common.Utils;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortingAssistant.UnitTests
{
    public class SupportedVersionTests
    {
        private string S3BucketName = "";
        private string S3File = "";
        private string BucketOwnerId = "";
        private string SupportedVersionConfig = @"
        {
            ""FormatVersion"": ""1.0"",
            ""Versions"": [
                {
                    ""DisplayName"": "".NET 6 (Microsoft LTS)"",
                    ""TargetFrameworkMoniker"": ""net6.0"",
                    ""RequiredVisualStudioVersion"": ""17.0.0"",
                    ""RecommendOrder"": ""1""
                }
            ]
        }";

        private Mock<AmazonS3Client> _mockAmazonS3Client;
        private Mock<ILogger> _mockLogger;

        [OneTimeSetUp]
        public void OneTimeSetup()
        {
            _mockAmazonS3Client = new Mock<AmazonS3Client>(
                FallbackCredentialsFactory.GetCredentials(true),
                RegionEndpoint.USEast2);

            _mockLogger = new Mock<ILogger>();
        }

        [Test]
        public async Task Test_GetSupportedVersions_WithoutS3Response()
        {
            _mockAmazonS3Client.Reset();

            var result = await SupportedVersionUtils.GetSupportedConfigurationAsync(
                _mockAmazonS3Client.Object,
                S3BucketName,
                S3File,
                BucketOwnerId,
                _mockLogger.Object);

            Assert.Multiple(() =>
            {
                Assert.That(result.Item1, Is.Not.Null);
                Assert.That(result.Item2.Contains("Porting Assistant failed to configure supported versions."));
            });
        }
    }
}
