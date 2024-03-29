﻿using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using NUnit.Framework;
using PortingAssistant.Client.NuGet.Interfaces;
using PortingAssistant.Common.Utils;

namespace PortingAssistant.UnitTests
{
    public class HttpServiceUtilsTest
    {
        [Test]
        public void TestTryGetFile()
        {
            var service = new HttpService();
            string[] files =
            {
                "newtonsoft.json.json.gz",
                "dummy.fake.json.gz"
            };
            Task<bool>[] tasks = files.Select((file) =>
                    HttpServiceUtils.TryGetFile(service, file))
                .ToArray();
            Task.WhenAll(tasks).Wait();
            Assert.IsTrue(tasks[0].Result);
            Assert.IsFalse(tasks[1].Result);
        }

        [Test]
        public void TestInternetAccessCheck()
        {
            var service = new HttpService();
            string[] files =
            {
                "newtonsoft.json.json.gz",
                "dummy.fake.json.gz"
            };
            Assert.IsTrue(HttpServiceUtils.CheckInternetAccess(service, files));

            string[] allFakeFiles =
            {
                "dummy.fake.json.gz",
                "dummy2.fake.json.gz"
            };
            Assert.IsFalse(HttpServiceUtils.CheckInternetAccess(service, allFakeFiles));
        }

        private class HttpService : IHttpService
        {
            private readonly HttpClient _client = new HttpClient();

            public HttpService()
            {
                _client.BaseAddress =
                    new Uri("https://s3.us-west-2.amazonaws.com/aws.portingassistant.dotnet.datastore/");
            }
            public Task<Stream> DownloadS3FileAsync(string fileToDownload)
            {
                return _client.GetStreamAsync(fileToDownload);
            }

            public Task<Stream> DownloadGitHubFileAsync(string fileToDownload)
            {
                throw new System.NotImplementedException();
            }
        }
    }
}
