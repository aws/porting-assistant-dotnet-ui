﻿using PortingAssistant.Client.Model;
using System.Collections.Generic;

namespace PortingAssistant.Common.Model
{
    public class ProjectFilePortingRequest
    {
        public List<ProjectDetails> Projects { get; set; }
        public string SolutionPath { get; set; }
        public string TargetFramework { get; set; }
        public List<PackageRecommendation> RecommendedActions { get; set; }
    }
}
