using System;
using System.Collections.Generic;
using System.Text;

namespace PortingAssistant.Telemetry.Model
{
    public class SolutionMetrics : MetricsBase
    {
        public string SolutionPath { get; set; }
        public double AnalysisTime { get; set; }
    }
}