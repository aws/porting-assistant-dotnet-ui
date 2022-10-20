import createCachedSelector from "re-reselect";
import { matchPath } from "react-router";

import { pathValues } from "../../constants/paths";
import {
  ApiAnalysisResult,
  Project,
  ProjectApiAnalysisResult,
  ProjectToApiAnalysis,
  RecommendedAction
} from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { Failed, isFailed, isLoaded, isLoading, isLoadingWithData, isReloading, Loaded, Loading, Reloading } from "../../utils/Loadable";
import { RootState } from "../reducers";

export const selectSolutionToSolutionDetails = (state: RootState) => state.solution.solutionToSolutionDetails;
export const selectNugetPackages = (state: RootState) => state.nugetPackage.nugets;
export const selectApiAnalysis = (state: RootState) => state.solution.apiAnalysis;
export const selectSourceFileContents = (state: RootState) => state.file.sourceFileToContents;
export const selectTargetFramework = () => window.electron.getState("targetFramework")?.id || "net6.0";
export const selectCancelStatus = (state:RootState) => window.electron.getState("cancel");
export const selectAssesmentStatus = (state:RootState) => window.electron.getState("isAssesmentRunning");

export const selectCurrentSolutionPath = createCachedSelector(
  (_state: RootState, locationPath: string) => locationPath,
  locationPath => {
    const match = matchPath<{ solution: string; project: string }>(locationPath, {
      path: pathValues,
      exact: true,
      strict: false
    });
    if (match == null || match.params?.solution == null) {
      throw new Error(`Path: ${locationPath} does not match expected path.`);
    }
    const solutionPath = decodeURIComponent(match.params.solution);
    return solutionPath;
  }
)((_state, locationPath) => locationPath);

export const selectCurrentSolutionDetails = createCachedSelector(
  selectCurrentSolutionPath,
  selectSolutionToSolutionDetails,
  (currentSolutionPath, solutionToSolutiondetails) => {
    if (currentSolutionPath == null) {
      return Loading<SolutionDetails>();
    }
    const solutionDetails = solutionToSolutiondetails[currentSolutionPath];
    if (solutionDetails == null) {
      return Loading<SolutionDetails>();
    }
    return solutionDetails;
  }
)((_state, locationPath) => locationPath);

export const selectProjects = createCachedSelector(
  selectCurrentSolutionPath,
  selectCurrentSolutionDetails,
  (currentSolutionPath, currentSolutionDetails) => {
    if (currentSolutionPath == null) {
      return Loading<Project[]>();
    }

    if (isReloading(currentSolutionDetails)) {
      const prevProject = currentSolutionDetails.data.projects;
      if (prevProject === undefined) {
        return Loading<Project[]>();
      }
      return Reloading<Project[]>(prevProject);
    }
    if (isLoadingWithData(currentSolutionDetails)) {
      return Loading(currentSolutionDetails.data.projects);
    }
    if (isLoading(currentSolutionDetails)) {
      return Loading<Project[]>();
    }
    if (isFailed(currentSolutionDetails)) {
      return Failed<Project[]>(currentSolutionDetails.error, currentSolutionDetails.message);
    }
    return Loaded(currentSolutionDetails.data.projects);
  }
)((_state, locationPath) => locationPath);

export const selectCurrentSolutionApiAnalysis = createCachedSelector(
  selectCurrentSolutionPath,
  selectApiAnalysis,
  (currentSolutionPath, apiAnalysis) => {
    if (currentSolutionPath == null) {
      return {} as ProjectToApiAnalysis;
    }
    return apiAnalysis[currentSolutionPath];
  }
)((_state, locationPath) => locationPath);

export const selectCurrentProject = createCachedSelector(
  selectProjects,
  (_state: RootState, locationPath: string) => locationPath,
  (projects, locationPath) => {
    const match = matchPath<{ solution: string; project: string }>(locationPath, {
      path: pathValues,
      exact: true,
      strict: false
    });
    if (match == null || match.params?.project == null) {
      throw new Error(`Path: ${locationPath} does not match expected path.`);
    }
    const projectPath = decodeURIComponent(match.params.project);
    if (isReloading(projects)) {
      const prevProject = projects.data.find(project => project.projectFilePath === projectPath);
      if (prevProject === undefined) {
        return Loading<Project>();
      }
      return Reloading<Project>(prevProject);
    }
    if (isLoading(projects)) {
      return Loading<Project>();
    }
    if (isFailed(projects)) {
      return Failed<Project>(projects.error, projects.message);
    }
    const project = projects.data.find(project => project.projectFilePath === projectPath);
    if (project === undefined) {
      throw new Error(`Cannot find project on path ${projectPath}`);
    }
    return Loaded(project);
  }
)((_state, locationPath) => locationPath);

export const selectCurrentProjectApiAnalysis = createCachedSelector(
  selectCurrentSolutionPath,
  selectCurrentProject,
  selectApiAnalysis,
  (solutionPath, project, apiAnalysis) => {
    if (!isLoaded(project) || solutionPath == null || project.data.projectFilePath == null) {
      return Loading<ProjectApiAnalysisResult>();
    }
    return apiAnalysis[solutionPath][project.data.projectFilePath];
  }
)((_state, locationPath) => locationPath);

export const selectCurrentSourceFileInvocations = createCachedSelector(
  selectCurrentProjectApiAnalysis,
  (_state: RootState, locationPath: string) => locationPath,
  (apiAnalysis, locationPath) => {
    const match = matchPath<{ solution: string; project: string; sourceFile: string }>(locationPath, {
      path: pathValues,
      exact: true,
      strict: false
    });
    if (match == null || match.params?.sourceFile == null) {
      throw new Error(`Path: ${locationPath} does not match expected path.`);
    }
    const sourceFile = decodeURIComponent(match.params.sourceFile);
    if (isLoading(apiAnalysis)) {
      return Loading<ApiAnalysisResult[]>();
    }
    if (isFailed(apiAnalysis)) {
      return Failed<ApiAnalysisResult[]>(apiAnalysis.error, apiAnalysis.message);
    }

    const apiAanlysisResults =
      apiAnalysis.data.sourceFileAnalysisResults != null
        ? apiAnalysis.data.sourceFileAnalysisResults.find(api => api.sourceFilePath === sourceFile)?.apiAnalysisResults
        : null;
    if (apiAanlysisResults != null) {
      if (isReloading(apiAnalysis)) {
        return Reloading(apiAanlysisResults);
      }
      return Loaded(apiAanlysisResults);
    }
    return Loading<ApiAnalysisResult[]>();
  }
)((_state, locationPath) => locationPath);

export const selectCurrentSourceFilePortingActions = createCachedSelector(
  selectCurrentProjectApiAnalysis,
  (_state: RootState, locationPath: string) => locationPath,
  (apiAnalysis, locationPath) => {
    const match = matchPath<{ solution: string; project: string; sourceFile: string }>(locationPath, {
      path: pathValues,
      exact: true,
      strict: false
    });
    if (match == null || match.params?.sourceFile == null) {
      throw new Error(`Path: ${locationPath} does not match expected path.`);
    }
    const sourceFile = decodeURIComponent(match.params.sourceFile);
    if (isLoading(apiAnalysis)) {
      return Loading<RecommendedAction[]>();
    }
    if (isFailed(apiAnalysis)) {
      return Failed<RecommendedAction[]>(apiAnalysis.error, apiAnalysis.message);
    }

    const portingActions =
      apiAnalysis.data.sourceFileAnalysisResults != null
        ? apiAnalysis.data.sourceFileAnalysisResults.find(api => api.sourceFilePath === sourceFile)?.recommendedActions
        : null;
    if (portingActions != null) {
      if (isReloading(apiAnalysis)) {
        return Reloading(portingActions);
      }
      return Loaded(portingActions);
    }
    return Loading<RecommendedAction[]>();
  }
)((_state, locationPath) => locationPath);

export const selectCurrentSourceFilePath = createCachedSelector(
  (_state: RootState, locationPath: string) => locationPath,
  locationPath => {
    const match = matchPath<{ solution: string; project: string; sourceFile: string }>(locationPath, {
      path: pathValues,
      exact: true,
      strict: false
    });
    if (match == null || match.params?.sourceFile == null) {
      throw new Error(`Path: ${locationPath} does not match expected path.`);
    }
    return decodeURIComponent(match.params.sourceFile);
  }
)((_state, locationPath) => locationPath);
