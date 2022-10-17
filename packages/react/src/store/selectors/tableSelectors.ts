import path from "path";
import createCachedSelector from "re-reselect";
import { matchPath } from "react-router";
import { createSelector } from "reselect";

import { ApiTableData } from "../../components/AssessShared/ApiTable";
import { SourceFile } from "../../components/AssessShared/FileTable";
import { NugetPackageTableFields } from "../../components/AssessShared/NugetPackageTable";
import { TableData } from "../../components/AssessSolution/ProjectsTable";
import { DashboardTableData } from "../../components/Dashboard/DashboardTable";
import { pathValues } from "../../constants/paths";
import { PortingProjects } from "../../models/porting";
import {
  PackageToPackageAnalysisResult,
  ProjectToApiAnalysis,
  SolutionToApiAnalysis,
  SolutionToSolutionDetails
} from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { getCompatibleApi, getSelectedInvocations } from "../../utils/getCompatibleApi";
import { getCompatibleNugetsAgg, getIncompatibleNugets } from "../../utils/getCompatibleNugets";
import { getPercent, getPercentNumber } from "../../utils/getPercent";
import { isPortingCompleted } from "../../utils/isPortingCompleted";
import { hasNewData, isFailed, isLoaded, isLoading, isReloading, Loadable } from "../../utils/Loadable";
import { nugetPackageKey } from "../../utils/NugetPackageKey";
import { RootState } from "../reducers";
import { selectPortingProjects, selectPortingProjectsInSolution } from "./portingSelectors";
import {
  selectApiAnalysis,
  selectCurrentProject,
  selectCurrentSolutionApiAnalysis,
  selectCurrentSolutionDetails,
  selectCurrentSolutionPath,
  selectNugetPackages,
  selectProjects,
  selectSolutionToSolutionDetails,
  selectTargetFramework
} from "./solutionSelectors";

export const portedProjects = (
  item: SolutionDetails,
  solutionToSolutionDetails: SolutionToSolutionDetails,
  portingProjects: PortingProjects
) => {
  if (item.solutionFilePath == null) {
    return 0;
  }
  const solutionDetails = solutionToSolutionDetails[item.solutionFilePath];
  if (solutionDetails == null || !hasNewData(solutionDetails)) {
    return 0;
  }
  return Object.values(solutionDetails.data.projects).filter(p =>
    isPortingCompleted(solutionDetails.data.solutionFilePath, p, portingProjects)
  ).length;
};

export const getApiCounts = (
  solutionPath: string,
  solutionToApiAnalysis: SolutionToApiAnalysis,
  solutionDetails: Loadable<SolutionDetails>,
  targetFramework: string
) => {
  if (hasNewData(solutionDetails) && solutionDetails.data.projects.length === 0) {
    return [0, 0];
  }
  const projectToApiAnalysis = solutionToApiAnalysis[solutionPath];
  if (projectToApiAnalysis == null) {
    return null;
  }
  const result = getCompatibleApi(solutionDetails, projectToApiAnalysis, null, null, targetFramework);
  if (result.isApisLoading) {
    return null;
  }
  return result.values;
};

export const getNugetCounts = (
  solutionPath: string,
  solutionToSolutionDetails: SolutionToSolutionDetails,
  packageToPackageAnalysisResult: PackageToPackageAnalysisResult
) => {
  const solutionDetails = solutionToSolutionDetails[solutionPath];
  if (!hasNewData(solutionDetails)) {
    return null;
  }
  const result = getCompatibleNugetsAgg(
    solutionDetails.data.projects.flatMap(p => p.packageReferences || []),
    packageToPackageAnalysisResult
  );
  if (!result.isAllNugetLoaded) {
    return null;
  }
  const compatibleCount = result.nugetAggregates.compatible;
  const totalCount =
    result.nugetAggregates.compatible + result.nugetAggregates.incompatible + result.nugetAggregates.unknown;
  return [compatibleCount, totalCount];
};

export const getErrorCounts = (
  projectToApiAnalysis: ProjectToApiAnalysis,
  projectPath?: string | null,
  sourceFile?: string | null
) => {
  if (projectToApiAnalysis == null) {
    return 0;
  }

  const selectedInvocations = getSelectedInvocations(projectToApiAnalysis, projectPath, sourceFile);
  return Object.values(selectedInvocations).reduce((agg, cur) => {
    if (cur == null || !hasNewData(cur)) {
      return agg;
    }
    return agg + cur.data.errors.length;
  }, 0);
};

export const getActionCounts = (
  projectToApiAnalysis: ProjectToApiAnalysis,
  projectPath?: string | null,
  sourceFile?: string | null
) => {
  if (projectToApiAnalysis == null) {
    return 0;
  }

  const selectedInvocations = getSelectedInvocations(projectToApiAnalysis, projectPath, sourceFile);
  return Object.values(selectedInvocations).reduce((agg, cur) => {
    if (cur == null ||!hasNewData(cur)) {
      return agg;
    }
    const actions = cur.data.sourceFileAnalysisResults.reduce((agg, cur) => {
      return agg + cur.recommendedActions.length;
    }, 0);
    return agg + actions;
  }, 0);
};

export const selectDashboardTableData = createSelector(
  selectNugetPackages,
  selectApiAnalysis,
  selectSolutionToSolutionDetails,
  selectPortingProjects,
  selectTargetFramework,
  (
    packageToPackageAnalysisResult,
    solutionToApiAnalysis,
    solutionToSolutionDetails,
    solutionToPortingProjects,
    targetFramework
  ): DashboardTableData[] => {
    return Object.entries(solutionToSolutionDetails)
      .map(([solutionPath, solutionDetails]) => {
        if (solutionPath == null) {
          return null;
        }
        if (!hasNewData(solutionDetails) && !isReloading(solutionDetails)) {
          if (isFailed(solutionDetails)) {
            return {
              name: path.basename(solutionPath),
              path: solutionPath,
              portedProjects: 0,
              totalProjects: 0,
              incompatiblePackages: 0,
              totalPackages: 0,
              incompatibleApis: 0,
              totalApis: 0,
              buildErrors: 0,
              portingActions: 0,
              failed: true
            } as DashboardTableData;
          }
          return {
            name: path.basename(solutionPath),
            path: solutionPath
          } as DashboardTableData;
        }
        const nugetCompatibility = getNugetCounts(
          solutionPath,
          solutionToSolutionDetails,
          packageToPackageAnalysisResult
        );
        const apiCompatibility = getApiCounts(solutionPath, solutionToApiAnalysis, solutionDetails, targetFramework);
        const buildErrors = getErrorCounts(solutionToApiAnalysis[solutionPath]);
        const portingActions = getActionCounts(solutionToApiAnalysis[solutionPath]);
        return {
          name: solutionDetails.data.solutionName || "-",
          path: solutionDetails.data.solutionFilePath || "-",
          portedProjects: portedProjects(
            solutionDetails.data,
            solutionToSolutionDetails,
            solutionToPortingProjects[solutionDetails.data.solutionFilePath]
          ),
          totalProjects: solutionDetails.data.projects.length || 0,
          incompatiblePackages: nugetCompatibility == null ? undefined : nugetCompatibility[1] - nugetCompatibility[0],
          totalPackages: nugetCompatibility == null ? undefined : nugetCompatibility[1],
          incompatibleApis:
            nugetCompatibility == null || apiCompatibility == null
              ? undefined
              : apiCompatibility[1] - apiCompatibility[0],
          totalApis: nugetCompatibility == null || apiCompatibility == null ? undefined : apiCompatibility[1],
          buildErrors: buildErrors,
          portingActions: portingActions,
          failed: false,
        } as DashboardTableData;
      })
      .filter((r): r is DashboardTableData => r != null);
  }
);

export const selectSolutionToApiAnalysis = createSelector(
  selectApiAnalysis,
  (
    solutionToApiAnalysis,
  ) : SolutionToApiAnalysis => {
    return solutionToApiAnalysis
  }
);

export const selectProjectTableData = createCachedSelector(
  selectApiAnalysis,
  selectNugetPackages,
  selectCurrentSolutionDetails,
  selectCurrentSolutionPath,
  selectPortingProjectsInSolution,
  selectTargetFramework,
  (apiAnalysis, nugetPackages, solutionDetails, solutionFilePath, portingProjects, targetFramework) => {
    if (!hasNewData(solutionDetails)) {
      return [];
    }
    return solutionDetails.data.projects.map<TableData>(project => {
      const projectToApiAnalysis = apiAnalysis[solutionFilePath];
      const apis = getCompatibleApi(
        solutionDetails,
        projectToApiAnalysis,
        project.projectFilePath,
        null,
        targetFramework
      );
      return {
        projectName: project.projectName || "-",
        projectPath: project.projectFilePath || "-",
        solutionPath: solutionFilePath || "-",
        targetFramework: project.targetFrameworks?.join(", ") || "-",
        referencedProjects: project.projectReferences?.length || 0,
        incompatiblePackages: getIncompatibleNugets(nugetPackages, project.packageReferences || []),
        totalPackages: project.packageReferences?.length || 0,
        incompatibleApis: apis.values[1] - apis.values[0] || null,
        totalApis: apis.values[1],
        buildErrors: getErrorCounts(projectToApiAnalysis, project.projectFilePath, null),
        portingActions: getActionCounts(projectToApiAnalysis, project.projectFilePath, null),
        ported: isPortingCompleted(solutionFilePath, project, portingProjects),
        buildFailed:
          project.projectFilePath != null &&
          projectToApiAnalysis != null &&
          isFailed(projectToApiAnalysis[project.projectFilePath])
      };
    });
  }
)((_state, locationPath) => locationPath);

export const getProjectIfExists = (state: RootState, locationPath: string) => {
  const match = matchPath<{ solution: string; project: string }>(locationPath, {
    path: pathValues,
    exact: true,
    strict: false
  });
  if (match == null || match.params?.project == null) {
    return null;
  }
  return selectCurrentProject(state, locationPath);
};

export const selectApiTableData = createCachedSelector(
  selectCurrentSolutionApiAnalysis,
  getProjectIfExists,
  selectTargetFramework,
  (currentSolutionApiAnalysis, project, targetFramework) => {
    if ((project != null && !hasNewData(project)) || currentSolutionApiAnalysis == null) {
      return Array<ApiTableData>();
    }
    const apiNameToApiItem: { [api: string]: ApiTableData } = {};

    const allApiAnalysis =
      project == null
        ? Object.values(currentSolutionApiAnalysis)
        : [currentSolutionApiAnalysis[project.data.projectFilePath]];
    let isApisLoading = false;
    allApiAnalysis.forEach(projectApiAnalysisResult => {
      if (isLoading(projectApiAnalysisResult) || isReloading(projectApiAnalysisResult)) {
        isApisLoading = true;
      }
      if (!hasNewData(projectApiAnalysisResult) || projectApiAnalysisResult.data.sourceFileAnalysisResults == null) {
        return;
      }
      projectApiAnalysisResult.data.sourceFileAnalysisResults.forEach(sourceFileAnalysisResult => {
        sourceFileAnalysisResult.apiAnalysisResults.forEach(apiResult => {
          if (
            apiResult == null ||
            apiResult?.codeEntityDetails == null ||
            apiResult?.codeEntityDetails?.package == null ||
            apiResult?.codeEntityDetails?.package?.packageId == null ||
            apiResult?.codeEntityDetails?.package?.version == null ||
            apiResult?.codeEntityDetails?.originalDefinition == null
          ) {
            return;
          }
          const apiName = `${
            apiResult.codeEntityDetails.originalDefinition
          }-${apiResult.codeEntityDetails.package.packageId.toLowerCase()}-${
            apiResult.codeEntityDetails.package.version
          }`;
          const apiItem = apiNameToApiItem[apiName];
          if (apiItem != null) {
            apiItem.calls += 1;
            apiItem.sourceFiles.add(sourceFileAnalysisResult.sourceFilePath);
            apiItem.locations.push({
              sourcefilePath: sourceFileAnalysisResult.sourceFilePath,
              location: apiResult.codeEntityDetails.textSpan?.startLinePosition || 0
            });
          } else {
            const api: ApiTableData = {
              apiName: apiResult.codeEntityDetails.originalDefinition || "-",
              packageName: apiResult.codeEntityDetails.package.packageId || "-",
              packageVersion: apiResult.codeEntityDetails.package.version,
              calls: 1,
              sourceFiles: new Set<string>([sourceFileAnalysisResult.sourceFilePath]),
              locations: new Array<{ sourcefilePath: string; location: number }>({
                sourcefilePath: sourceFileAnalysisResult.sourceFilePath,
                location: apiResult.codeEntityDetails.textSpan?.startLinePosition || 0
              }),
              replacement: apiResult.recommendations.recommendedActions
                .map(recomendedAction => recomendedAction.description)
                .join(","),
              isCompatible: apiResult.compatibilityResults[targetFramework]?.compatibility,
              deprecated: apiResult.compatibilityResults[targetFramework]?.compatibility === "DEPRACATED"
            };
            apiNameToApiItem[apiName] = api;
          }
        });
      });
    });
    if (isApisLoading) {
      return null;
    }
    return Object.values(apiNameToApiItem);
  }
)((_state, locationPath) => locationPath);

export const selectFileTableData = createCachedSelector(
  selectNugetPackages,
  getProjectIfExists,
  selectCurrentSolutionDetails,
  selectCurrentSolutionApiAnalysis,
  selectProjects,
  selectTargetFramework,
  (nugetPackages, project, solutionDetails, solutionApiAnalysis, solutionProjects, targetFramework) => {
    if (
      (solutionDetails != null && !hasNewData(solutionDetails)) ||
      (project != null && !hasNewData(project)) ||
      solutionApiAnalysis == null
    ) {
      return Array<SourceFile>();
    }
    let isFilesLoading = false;
    const allApiAnalysis =
      project == null ? Object.values(solutionApiAnalysis) : [solutionApiAnalysis[project.data.projectFilePath]];
    const allSourceFileToInvocations = allApiAnalysis.reduce((agg, cur) => {
      if (isLoading(cur)) {
        isFilesLoading = true;
      }
      if (!hasNewData(cur)) {
        return agg;
      }
      if (cur.data.sourceFileAnalysisResults == null) {
        return agg;
      }
      cur.data.sourceFileAnalysisResults.forEach(sourceFileAnalysisResult => {
        if (sourceFileAnalysisResult == null) {
          return;
        }
        agg[sourceFileAnalysisResult.sourceFilePath] = cur.data.projectFile;
      });
      return agg;
    }, {} as { [filename: string]: string });
    if (isFilesLoading) {
      return null;
    }
    if (!hasNewData(solutionProjects)) {
      return null;
    }
    return Object.entries(allSourceFileToInvocations).map(([sourceFile, projectPath]) => {
      const compatibleApis = getCompatibleApi(
        solutionDetails,
        solutionApiAnalysis,
        projectPath,
        sourceFile,
        targetFramework
      );
      return {
        sourceFilePath: sourceFile,
        incompatibleApis: compatibleApis.values[1] - compatibleApis.values[0],
        totalApis: compatibleApis.values[1],
        solutionPath: solutionDetails.data.solutionFilePath,
        projectPath: projectPath,
        portability: getPercent(compatibleApis.values[0], compatibleApis.values[1]),
        portabilityNumber: getPercentNumber(compatibleApis.values[0], compatibleApis.values[1]),
        isProjectPage: project != null
      } as SourceFile;
    });
  }
)((_state, locationPathname) => locationPathname);

export const selectNugetTableData = createCachedSelector(
  selectCurrentSolutionApiAnalysis,
  selectNugetPackages,
  selectProjects,
  getProjectIfExists,
  selectTargetFramework,
  (apiAnalysis, packageToPackageAnalysisResult, projects, project, targetFramework) => {
    if (!hasNewData(projects) || (project != null && !hasNewData(project))) {
      return [];
    }
    const selectedProjects = project != null ? [project.data] : projects.data;
    const fileApiFrequency = selectedProjects
      .flatMap(project => (project.projectFilePath == null ? [] : apiAnalysis[project.projectFilePath]))
      .reduce<{ [packageVersion: string]: { file: number; api: number; sourceFilesList: string[]; apiSet: Set<string> } }>((agg, current) => {
        if (!hasNewData(current) || current.data.sourceFileAnalysisResults == null) {
          return agg;
        }
        current.data.sourceFileAnalysisResults.forEach(sourceFileAnalysisResult => {
          const packageVersionsInFile = new Set<string>();
          sourceFileAnalysisResult.apiAnalysisResults.forEach(apiResult => {
            if (
              apiResult == null ||
              apiResult?.codeEntityDetails == null ||
              apiResult?.codeEntityDetails?.package == null ||
              apiResult?.codeEntityDetails?.package?.packageId == null ||
              apiResult?.codeEntityDetails?.package?.version == null
            ) {
              return;
            }
            const versionFromProject = selectedProjects
              ?.find(p => p.projectFilePath === sourceFileAnalysisResult.sourceFilePath)
              ?.packageReferences?.find(n => n.packageId === apiResult?.codeEntityDetails?.package?.packageId)?.version;
            const version =
              versionFromProject == null ? apiResult?.codeEntityDetails?.package?.version : versionFromProject;
            const key = nugetPackageKey(apiResult?.codeEntityDetails?.package?.packageId, version);
            if (agg[key] !== undefined) {
              agg[key].api += 1;
              if (apiResult.codeEntityDetails.originalDefinition) agg[key].apiSet.add(apiResult.codeEntityDetails.originalDefinition);
            } else {
              agg[key] = { api: 1, file: 0 , sourceFilesList: [], apiSet: new Set()};
              if (apiResult?.codeEntityDetails?.originalDefinition) agg[key].apiSet.add(apiResult?.codeEntityDetails?.originalDefinition);
            }
            packageVersionsInFile.add(key);
          });
          packageVersionsInFile.forEach(packageVersion => {
            agg[packageVersion].file += 1;
            agg[packageVersion].sourceFilesList.push(sourceFileAnalysisResult.sourceFilePath);
          });
        });
        return agg;
      }, {});

    return Object.values(
      selectedProjects
        .flatMap(project => project.packageReferences)
        .reduce<{ [packageVersion: string]: NugetPackageTableFields }>((agg, current) => {
          if (current == null || current.packageId == null || current.version == null) {
            return agg;
          }
          const key = nugetPackageKey(current.packageId, current.version);
          if (agg[key] !== undefined) {
            agg[key].frequency += 1;
          } else {
            const packageAnalysisResult = packageToPackageAnalysisResult[key];
            let replacement = "-";
            if (hasNewData(packageAnalysisResult)) {
              const compatibility = packageAnalysisResult.data.compatibilityResults[targetFramework]?.compatibility;
              const recommends = packageAnalysisResult.data.recommendations.recommendedActions
                .filter(
                  recommend =>
                    recommend.recommendedActionType === "ReplacePackage" ||
                    recommend.recommendedActionType === "UpgradePackage"
                )
                .map(recommend => recommend.description);

              if (recommends != null && recommends.length !== 0) {
                replacement = recommends.join(",");
              }
              agg[key] = {
                ...current,
                frequency: 1,
                apis: fileApiFrequency[key]?.api || 0,
                apiSet: fileApiFrequency[key]?.apiSet || new Set(),
                sourceFiles: fileApiFrequency[key]?.file || 0,
                sourceFilesList: fileApiFrequency[key]?.sourceFilesList || [],
                replacement: replacement,
                compatible: compatibility,
                failed: isFailed(packageAnalysisResult),
                deprecated: compatibility === "DEPRACATED"
              };
            } else {
              agg[key] = {
                ...current,
                frequency: 1,
                apis: fileApiFrequency[key]?.api || 0,
                apiSet: fileApiFrequency[key]?.apiSet || new Set(),
                sourceFiles: fileApiFrequency[key]?.file || 0,
                sourceFilesList: fileApiFrequency[key]?.sourceFilesList || [],
                replacement: replacement,
                compatible: "UNKNOWN",
                failed: isFailed(packageAnalysisResult),
                deprecated: false
              };
            }
          }
          return agg;
        }, {})
    );
  }
)((_state, locationPath) => locationPath);
