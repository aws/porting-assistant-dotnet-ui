using NUnit.Framework;
using PortingAssistant.Common.Utils;
using System;
using PortingAssistant.Client.Model;
using System.Collections.Generic;
using PortingAssistant.Telemetry.Utils;
using PortingAssistant.Client.Common.Model;

namespace PortingAssistant.UnitTests
{
    [TestFixture]
    public class PIIObfuscationUnitTest
    {
        [Test]
        public void TestSolutionPath() 
        {
            Telemetry.Model.MetricsBase.UsingDefault = true;
            var solutionPath = "C:/Users/CustomerName/nopCommerce/src/NopCommerce.sln";
            var encryptedSolutionPath = CryptoUtil.HashString(solutionPath);
            var runId = "1";
            var triggerType = "TestRequest";
            var targetFramework = "netcoreapp3.1";
            var solutionAnalysisResult = new SolutionAnalysisResult {
                SolutionDetails = new SolutionDetails
                {
                    SolutionName = "test",
                    SolutionFilePath = solutionPath,
                    ApplicationGuid = "test-application-guid",
                    SolutionGuid = "test-solution-guid",
                    RepositoryUrl = "https://github.com/test-project",
                }
            };
            var solutionMetric = TelemetryCollectionUtils.createSolutionMetric(solutionAnalysisResult, runId, triggerType, targetFramework, DateTime.Now, false);
            Assert.AreEqual(solutionMetric.SolutionPath, encryptedSolutionPath);
            Assert.AreEqual(solutionMetric.ApplicationGuid, "test-application-guid");
            Assert.AreEqual(solutionMetric.SolutionGuid, "test-solution-guid");
            Assert.AreEqual(solutionMetric.RepositoryUrl, "https://github.com/test-project");
            Assert.AreEqual(solutionMetric.UsingDefaultCreds, true);
            Assert.AreEqual(solutionMetric.Canceled, false);
        }

        [Test]
        public void TestProjectGuid()
        {
            var runId = "1";
            var triggerType = "TestRequest";
            var targetFramework = "netcoreapp3.1";
            var projectGuid = Guid.NewGuid().ToString();
            var encryptedProjectGuid = CryptoUtil.HashString(projectGuid);
            var projectAnalysisResult = new ProjectAnalysisResult
            {
                ProjectName = "TestProject",
                ProjectFilePath = "pathToFile",
                ProjectGuid = projectGuid,
                ProjectType = "FormatA",
                TargetFrameworks = new List<string> { "one", "two" },
                PackageReferences = new List<PackageVersionPair> { new PackageVersionPair { PackageId = "System.Diagnostics.Tools", Version = "4.1.2" }, new PackageVersionPair { PackageId = "", Version = "" } },
                ProjectReferences = new List<ProjectReference> { new ProjectReference { ReferencePath = "a" }, new ProjectReference { ReferencePath = "b" }, new ProjectReference { ReferencePath = "c" } },
                IsBuildFailed = false,
                ProjectCompatibilityResult = new ProjectCompatibilityResult { ProjectPath = "test.csproj" },
                SourceFileAnalysisResults = new List<SourceFileAnalysisResult> {
                    new SourceFileAnalysisResult {
                        ApiAnalysisResults = new List<ApiAnalysisResult> {
                            new ApiAnalysisResult {
                                CompatibilityResults = new Dictionary<string, CompatibilityResult> {
                                    { "test", new CompatibilityResult {
                                        Compatibility = Compatibility.COMPATIBLE
                                    } }
                                }
                            }
                        }
                    } },
                Errors = new List<string> { },
            };
            var projectMetric = TelemetryCollectionUtils.createProjectMetric(runId, triggerType, targetFramework, projectAnalysisResult);
            Assert.AreEqual(projectMetric.ProjectGuid, encryptedProjectGuid);
        }
    }
}
