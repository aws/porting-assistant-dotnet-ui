using System;
using System.Collections.Generic;

namespace PortingAssistant.Client.Model
{
    public class ProjectApiAnalysisResultExtended: ProjectApiAnalysisResult
    {
        public List<String> TargetFrameworks { get; set; }
        public string ProjectName { get; set; }
        public string ProjectType { get; set; }
        public string FeatureType { get; set; }
        public PackageVersionPair[] PacakgeReferences { get; set; }
        public ProjectReference[] ProjectReferences { get; set; }
        public Boolean IsBuildFailed { get; set; }
    }
}