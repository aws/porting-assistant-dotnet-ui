import { produce } from "immer";
import { createReducer } from "typesafe-actions";

import { SolutionToApiAnalysis, SolutionToSolutionDetails } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { Failed, isLoaded, isLoading, isLoadingWithData, isReloading, Loaded, Loading, Reloading } from "../../utils/Loadable";
import { analyzeSolution, getApiAnalysis, partialSolutionUpdate, removeSolution, setProfileSet } from "../actions/backend";
export const backendReducer = createReducer({
  apiAnalysis: {} as SolutionToApiAnalysis,
  solutionToSolutionDetails: {} as SolutionToSolutionDetails,
  profileSet: false
})
  .handleAction(analyzeSolution.request, (state, action) =>
    produce(state, draftState => {
      const existingSolution = state.solutionToSolutionDetails[action.payload.solutionPath];
      if (isLoaded(existingSolution) && action.payload.force !== true) {
        return;
      }
      draftState.solutionToSolutionDetails[action.payload.solutionPath] = isLoaded(existingSolution)
        ? Reloading(existingSolution.data)
        : Loading();
    })
  )
  .handleAction(analyzeSolution.success, (state, action) =>
    produce(state, draftState => {
      if (state.solutionToSolutionDetails[action.payload.solutionDetails.solutionFilePath] !== undefined) {
        draftState.solutionToSolutionDetails[action.payload.solutionDetails.solutionFilePath] = Loaded(
          action.payload.solutionDetails
        );
      }
        })
  )
  .handleAction(analyzeSolution.failure, (state, action) =>
    produce(state, draftState => {
      draftState.solutionToSolutionDetails[action.payload.solutionPath] = Failed(action.payload.error);
    })
  )
  .handleAction(partialSolutionUpdate, (state, action) =>
    produce(state, draftState => {
      var existingSolution = state.solutionToSolutionDetails[action.payload.solutionPath];
      if (existingSolution === undefined) {
        return;
      }
      const project = action.payload.projectPath;
      const projectFailed = action.payload.data === null || action.payload.data === undefined;
      var modifiedSolutionDetails = null;
      if (isReloading(existingSolution) || (isLoading(existingSolution) && !isLoadingWithData(existingSolution))) {
        var partialSolutionDetails: SolutionDetails = {
          solutionName: action.payload.solutionPath.split("\\").reverse()[0].split('.')[0],
          solutionFilePath: action.payload.solutionPath,
          failedProjects: projectFailed ? [project] : [],
          projects: projectFailed ? [] : [{
            projectFilePath: project,
            isBuildFailed: false,
            projectName: action.payload.data?.projectName,
            targetFrameworks: action.payload.data?.targetFrameworks,
            projectType: action.payload.data?.projectType,
            packageReferences: action.payload.data?.packageReferences,
            projectReferences: action.payload.data?.projectReferences
          }]
        }
        draftState.solutionToSolutionDetails[action.payload.solutionPath] = Loading(partialSolutionDetails)
      } else if (isLoadingWithData(existingSolution)) {
        if (projectFailed) {
          var existingFailedProjects = existingSolution.data.failedProjects;
          modifiedSolutionDetails = {
            ...existingSolution.data,
            failedprojects: [...existingFailedProjects, project]
        }
          draftState.solutionToSolutionDetails[action.payload.solutionPath] = Loading(modifiedSolutionDetails)          
        } else {
          var existingProjects = existingSolution.data.projects;
          
          modifiedSolutionDetails = {
            ...existingSolution.data,
            projects: [...existingProjects, { 
              projectFilePath: project,
              isBuildFailed: false,
              projectName: action.payload.data?.projectName,
              targetFrameworks: action.payload.data?.targetFrameworks,
              projectType: action.payload.data?.projectType,
              packageReferences: action.payload.data?.packageReferences,
              projectReferences: action.payload.data?.projectReferences
            }]
        }
          draftState.solutionToSolutionDetails[action.payload.solutionPath] = Loading(modifiedSolutionDetails)
        }
      }
    })
  )
  .handleAction(getApiAnalysis.request, (state, action) =>
    produce(state, draftState => {
      const existingApiAnalysisSolution = state.apiAnalysis[action.payload];
      if (existingApiAnalysisSolution === undefined) {
        draftState.apiAnalysis[action.payload] = {};
        const solutionDetails = state.solutionToSolutionDetails[action.payload];
        if (isLoaded(solutionDetails) || isReloading(solutionDetails)) {
          solutionDetails.data.projects.forEach(project => {
            draftState.apiAnalysis[action.payload][project.projectFilePath] = Loading();
          });
        }
        return;
      }
      Object.entries(existingApiAnalysisSolution).forEach(([projectPath, project]) => {
        if (isLoaded(project)) {
          draftState.apiAnalysis[action.payload][projectPath] = Reloading(project.data);
        } else {
          draftState.apiAnalysis[action.payload][projectPath] = Loading();
        }
      });
    })
  )
  .handleAction(getApiAnalysis.success, (state, action) =>
    produce(state, draftState => {
      if (state.apiAnalysis[action.payload.solutionFile] !== undefined){
        if (state.apiAnalysis[action.payload.solutionFile] === undefined) {
          draftState.apiAnalysis[action.payload.solutionFile] = {};
        }
        draftState.apiAnalysis[action.payload.solutionFile][action.payload.projectFile] = Loaded(action.payload);
      }
            })
  )
  .handleAction(getApiAnalysis.failure, (state, action) =>
    produce(state, draftState => {
      if (state.apiAnalysis[action.payload.solutionFile] === undefined) {
        draftState.apiAnalysis[action.payload.solutionFile] = {};
      }
      draftState.apiAnalysis[action.payload.solutionFile][action.payload.projectFile] = Failed(action.payload.error);
    })
  )
  .handleAction(removeSolution, (state, action) =>
    produce(state, draftstate => {
      delete draftstate.solutionToSolutionDetails[action.payload];
      delete draftstate.apiAnalysis[action.payload];    
    })
  )
  .handleAction(setProfileSet, (state, action) =>
    produce(state, draftState => {
      draftState.profileSet = action.payload;
    })
  );
