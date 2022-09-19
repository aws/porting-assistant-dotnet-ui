import { has } from "immer/dist/internal";

import { ProjectToApiAnalysis } from "../models/project";
import { SolutionDetails } from "../models/solution";
import { hasNewData, isFailed, isLoaded, isLoading, isLoadingWithData, isReloading, Loadable, Loaded, Loading } from "./Loadable";

export const getCompatibleApi = (
  solutionDetails: Loadable<SolutionDetails>,
  invocations: ProjectToApiAnalysis | null,
  projectPath?: string | null,
  sourceFile?: string | null,
  target = "net6.0"
) => {
  if (invocations == null) {
    return { failureCount: 0, isApisLoading: true, values: [0, 0] };
  }
  const selectedInvocations = getSelectedInvocations(invocations, projectPath, sourceFile);
  let failureCount = 0;
  //todo add timeout?
  let isApisLoading = Object.values(selectedInvocations).some(analysis => isLoading(analysis) || isReloading(analysis));
  const allAnalysis = Object.values(selectedInvocations).reduce((agg, cur) => {
    if (isFailed(cur)) {
      failureCount += 1;
      return agg;
    }
    if (isLoading(cur) || isReloading(cur) || !hasNewData(solutionDetails)) {
      isApisLoading = true;
      return agg;
    } else {
      const project = solutionDetails.data.projects.find(p => p.projectFilePath === cur.data.projectFile);
      if (project == null) {
        failureCount += 1;
        return agg;
      }
      cur.data.sourceFileAnalysisResults
        .flatMap(arr => arr.apiAnalysisResults)
        .forEach(inv => {
          if (inv.codeEntityDetails == null || inv.codeEntityDetails.originalDefinition == null) {
            return;
          }
          agg[
            `${
              inv.codeEntityDetails.originalDefinition
            }-${inv.codeEntityDetails.package?.packageId?.toLowerCase()}-${inv.codeEntityDetails.package?.version?.toLowerCase()}`
          ] =
            inv.compatibilityResults[target]?.compatibility === "COMPATIBLE" ||
            inv.compatibilityResults[target]?.compatibility === "UNKNOWN";
        });
        if (!isLoaded(solutionDetails)) {
          isApisLoading = true;
        }
      return agg;
    }

  }, {} as { [method: string]: boolean });
  return {
    failureCount: failureCount,
    isApisLoading: isApisLoading,
    values: [Object.values(allAnalysis).filter(compat => compat).length, Object.values(allAnalysis).length]
  };
};

export const API_LOADING_AGGREGATE = {
  failureCount: 0,
  isApisLoading: true,
  values: [0, 0]
};

export type API_COMPATABILITIES  = IAPI_COMPATABILITIES
interface IAPI_COMPATABILITIES {
  failureCount: number,
  isApisLoading: boolean,
  values: number[]
}
export const getSelectedInvocations = (
  projectToApiAnalysis: ProjectToApiAnalysis,
  projectPath?: string | null,
  sourceFile?: string | null
): ProjectToApiAnalysis => {
  if (projectPath == null) {
    return projectToApiAnalysis;
  }
  if (sourceFile == null) {
    return { [projectPath]: projectToApiAnalysis[projectPath] };
  }
  const invocationProject = projectToApiAnalysis[projectPath];

  if (isLoaded(invocationProject) && invocationProject.data.sourceFileAnalysisResults != null) {
    const sourceFileItem = {
      projectFile: invocationProject.data.projectFile,
      solutionFile: invocationProject.data.solutionFile,
      errors: [""],
      sourceFileAnalysisResults: invocationProject.data.sourceFileAnalysisResults.filter(
        sourceFileAnalysis => sourceFileAnalysis.sourceFilePath === sourceFile
      ),
      targetFrameworks: invocationProject.data.targetFrameworks,
      projectName: invocationProject.data.projectName,
      projectType: invocationProject.data.projectType,
      featureType: invocationProject.data.featureType,
      isBuildFailed: false,
      pacakgeReferences: invocationProject.data.pacakgeReferences,
      projectReferences: invocationProject.data.projectReferences
    };
    return { [projectPath]: Loaded(sourceFileItem) };
  }
  return { [projectPath]: Loading() };
};
