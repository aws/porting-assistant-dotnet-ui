import createCachedSelector from "re-reselect";

import { isLoaded } from "../../utils/Loadable";
import { RootState } from "../reducers";
import { selectCurrentProject, selectCurrentSolutionPath } from "./solutionSelectors";

export const selectPortingProjects = (state: RootState) => state.porting.portingProjects;

export const selectPortingLocation = createCachedSelector(
  state => state,
  selectCurrentSolutionPath,
  (state, solutionFilePath) => {
    if (solutionFilePath == null) {
      return null;
    }
    return state.porting.portingLocations[solutionFilePath];
  }
)((_state, locationPath) => locationPath);

export const selectPortingProjectsInSolution = createCachedSelector(
  selectPortingProjects,
  selectCurrentSolutionPath,
  (portingProjects, solutionFilePath) => {
    if (solutionFilePath == null) {
      return null;
    }
    const porting = portingProjects[solutionFilePath];
    return porting;
  }
)((_state, locationPath) => locationPath);

export const selectPortingProject = createCachedSelector(
  selectCurrentSolutionPath,
  selectCurrentProject,
  selectPortingProjectsInSolution,
  (solutionFilePath, project, portingProjects) => {
    if (!isLoaded(project)) {
      return null;
    }
    if (portingProjects == null) {
      return null;
    }
    if (solutionFilePath == null) {
      return null;
    }
    if (project.data.projectFilePath == null) {
      return null;
    }
    const projectPath = window.electron.getRelativePath(solutionFilePath, project.data.projectFilePath);
    return portingProjects[projectPath];
  }
)((_state, locationPath) => locationPath);
