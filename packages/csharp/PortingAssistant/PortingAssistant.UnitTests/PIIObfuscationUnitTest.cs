using NUnit.Framework;
using System.Web.Helpers;
using PortingAssistant.Common.Utils;
using System;
using PortingAssistant.Client.Model;
using System.Collections.Generic;

namespace PortingAssistant.UnitTests
{
    [TestFixture]
    public class PIIObfuscationUnitTest
    {
        [Test]
        public void TestSolutionPath() 
        {
            var solutionPath = "C:/Users/CustomerName/nopCommerce/src/NopCommerce.sln";
            var encryptedSolutionPath = Crypto.SHA256(solutionPath); // 462eb7f46af82bd5155ef9f28ca3f5f638f702a7423b105478fa3d9267a344da
            var runId = "1";
            var triggerType = "TestRequest";
            var targetFramework = "netcoreapp3.1";
            var solutionMetric = TelemetryCollectionUtils.createSolutionMetric(solutionPath, runId, triggerType, targetFramework, DateTime.Now);
            Assert.AreEqual(solutionMetric.SolutionPath, encryptedSolutionPath);
        }

        [Test]
        public void TestProjectGuid()
        {
            var runId = "1";
            var triggerType = "TestRequest";
            var targetFramework = "netcoreapp3.1";
            var projectGuid = Guid.NewGuid().ToString();
            var encryptedProjectGuid = Crypto.SHA256(projectGuid);
            var projectAnalysisResult = new ProjectAnalysisResult
            {
                ProjectName = "TestProject",
                ProjectFilePath = "pathToFile",
                ProjectGuid = projectGuid,
                ProjectType = "FormatA",
                TargetFrameworks = new List<string> { "one", "two" },
                PackageReferences = new List<PackageVersionPair> { new PackageVersionPair {PackageId = "System.Diagnostics.Tools", Version="4.1.2" }, new PackageVersionPair { PackageId = "", Version = "" } },
                ProjectReferences = new List<ProjectReference> { new ProjectReference { ReferencePath = "a"}, new ProjectReference { ReferencePath = "b" }, new ProjectReference { ReferencePath = "c" } },
                IsBuildFailed = false 
            };
            var projectMetric = TelemetryCollectionUtils.createProjectMetric(runId, triggerType, targetFramework, projectAnalysisResult);
            Assert.AreEqual(projectMetric.ProjectGuid, encryptedProjectGuid);
        }
    }
}
