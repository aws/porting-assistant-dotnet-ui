using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace PortingAssistant.Common.Model
{    
    public class AssessmentManager
    {
        public static Dictionary<string, AssessmentState> solutionToAssessmentState = new();

        public static void addSolution(string solutionPath)
        {
            if (solutionExists(solutionPath))
            {
                solutionToAssessmentState[solutionPath] = new AssessmentState();
            } else
            {
                solutionToAssessmentState.Add(solutionPath, new AssessmentState());
            }

        }

        public static void setState(string solutionPath, Status state)
        {
            solutionToAssessmentState[solutionPath].state = state;
        }

        public static Status getState(string solutionPath)
        {
            return solutionToAssessmentState[solutionPath].state;
        }

        public static void addPreTriggerData(string solutionPath, PreTriggerData preTriggerData)
        {
            solutionToAssessmentState[solutionPath].preTriggerData = preTriggerData;
        }

        public static PreTriggerData getPreTriggerData(string solutionPath)
        {
            return solutionToAssessmentState[solutionPath].preTriggerData;
        }

        public static bool solutionExists(string solutionPath)
        {
            return solutionToAssessmentState.ContainsKey(solutionPath);
        }
    }
    public class AssessmentState
    {
        public Status  state { get; set; }
        public PreTriggerData preTriggerData { get; set; }
        public CancellationTokenSource cancellationTokenSource { get; set; }

        public AssessmentState()
        {
            state = Status.InProgress;
            cancellationTokenSource = new CancellationTokenSource();
        }

        public AssessmentState(PreTriggerData preTriggerData)
        {
            state = Status.InProgress;
            cancellationTokenSource = new CancellationTokenSource();
            this.preTriggerData = preTriggerData;
        }

    }

    public enum Status { Success, Failure, Cancelled, InProgress}
}
