import { createAction, createAsyncAction } from "typesafe-actions";

import { ProjectApiAnalysisResult } from "../../models/project";
import { SolutionDetails } from "../../models/solution";

export interface analyzeSolutionRequestPayload {
  solutionPath: string;
  runId: string;
  triggerType: string;
  settings: {
    ignoredProjects: string[];
    targetFramework: string;
    continiousEnabled: boolean;
    compatibleOnly: boolean;
    actionsOnly: boolean;
    msbuildPath?: string;
    msBuildArguments?: string[];
  };
  preTriggerData:string[];
  force?: boolean; 
}
export interface analyzeSolutionSuccessPayload {
  solutionDetails: SolutionDetails;
}
export interface analyzeSolutionFailurePayload {
  solutionPath: string;
  error: Error | string;
}
export const analyzeSolution = createAsyncAction(
  "analyzeSolution_Request",
  "analyzeSolution_Success",
  "analyzeSolution_Failure"
)<analyzeSolutionRequestPayload, analyzeSolutionSuccessPayload, analyzeSolutionFailurePayload>();

export interface getApiAnalysisFailurePayload {
  solutionFile: string;
  projectFile: string;
  error: string;
}
export const getApiAnalysis = createAsyncAction(
  "getApiAnalysis_Request",
  "getApiAnalysis_Success",
  "getApiAnalysis_Failure"
)<string, ProjectApiAnalysisResult, getApiAnalysisFailurePayload>();

export const init = createAction("init")<boolean>();

export const removeSolution = createAction("removeSolution")<string>();

export const setLastNugetRequestTime = createAction("setLastNugetRequestTime")<Date>();

export interface exportSolutionPayload {
  solutionPath: string;
}
export const exportSolution = createAction("exportSolution")<exportSolutionPayload>();
export const openSolutionInIDE = createAction("openSolutionInIDE")<string>();

export const setProfileSet = createAction("setProfileSet")<boolean>();

export const ping = createAction("ping")<void>();
