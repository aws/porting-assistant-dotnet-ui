using System;
using System.Collections.Generic;
using System.Linq;

namespace PortingAssistant.Common.Model
{
    /// <summary>
    /// Ideal way is to move this file in PortingAssistantClient,
    /// so all Standalone and IDE extensions can share the same definitions.
    /// Due to IDE extension Client is .NetFramework, while PortingAssitantClient is .NET Core 6.0,
    /// We have to copy this file in all places.
    /// </summary>
    public class SupportedVersion : IComparable<SupportedVersion>
    {
        public const string NET60 = "net6.0";
        public const string NETCOREAPP31 = "netcoreapp3.1";
        public const string NET50 = "net5.0";
        public const string NET70 = "net7.0";

        public string DisplayName { get; set; }
        public string TargetFrameworkMoniker { get; set; }
        public string RequiredVisualStudioVersion { get; set; }
        public string RecommendOrder { get; set; }

        public SupportedVersion()
        { }

        public SupportedVersion(SupportedVersion other)
        {
            DisplayName                 = other.DisplayName;
            TargetFrameworkMoniker      = other.TargetFrameworkMoniker;
            RequiredVisualStudioVersion = other.RequiredVisualStudioVersion;
            RecommendOrder              = other.RecommendOrder;
        }

        public int CompareTo(SupportedVersion other)
        {
            return this.RecommendOrder.CompareTo(other.RecommendOrder);
        }
    }

    public class SupportedVersionConfiguration
    {
        public const string S3Region                = "us-west-2";
        public const string S3BucketName            = "aws.portingassistant.dotnet.datastore";
        public const string S3File                  = "recommendationsync/ClientConfiguration/SupportedVersion.json";
        public const string ExpectedBucketOwnerId   = "015088035022";
        public string FormatVersion { get; set; }
        public List<SupportedVersion> Versions { get; set; }
        public SupportedVersionConfiguration()
        {
            Versions = new List<SupportedVersion>();
        }

        public static SupportedVersionConfiguration GetDefaultConfiguration()
        {
            return new SupportedVersionConfiguration()
            {
                FormatVersion = "1.0",
                Versions = new List<SupportedVersion>()
                {
                    new SupportedVersion()
                    {
                        DisplayName = ".NET 7 (Standard Term Support)",
                        TargetFrameworkMoniker = SupportedVersion.NET70,
                        RequiredVisualStudioVersion = "17.4.0",
                        RecommendOrder = "1",
                    },
                    new SupportedVersion()
                    {
                        DisplayName = ".NET 6 (Microsoft LTS)",
                        TargetFrameworkMoniker = SupportedVersion.NET60,
                        RequiredVisualStudioVersion = "17.0.0",
                        RecommendOrder = "2",
                    },
                    new SupportedVersion()
                    {
                        DisplayName = ".NET Core 3.1 (Microsoft LTS)",
                        TargetFrameworkMoniker = SupportedVersion.NETCOREAPP31,
                        RequiredVisualStudioVersion = "16.0.0",
                        RecommendOrder = "3",
                    },
                    new SupportedVersion()
                    {
                        DisplayName = ".NET 5 (Microsoft out of support)",
                        TargetFrameworkMoniker = SupportedVersion.NET50,
                        RequiredVisualStudioVersion = "16.0.0",
                        RecommendOrder = "4",
                    },
                }
            };
        }

        public string GetDisplayName(string versionKey)
        {
            return Versions.FirstOrDefault(v => v.TargetFrameworkMoniker == versionKey)?.DisplayName;
        }

        public string GetVersionKey(string displayName)
        {
            return Versions.FirstOrDefault(v => v.DisplayName == displayName)?.TargetFrameworkMoniker;
        }

        public SupportedVersionConfiguration DeepCopy()
        {
            var result = new SupportedVersionConfiguration()
            {
                FormatVersion = this.FormatVersion,
                Versions = new List<SupportedVersion>(),
            };

            this.Versions.ForEach(v =>
            {
                result.Versions.Add(new SupportedVersion(v));
            });

            return result;
        }
    }
}
