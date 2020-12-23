import { produce } from "immer";
import { createReducer } from "typesafe-actions";

import { SolutionToApiAnalysis, SolutionToSolutionDetails } from "../../models/project";
import { Failed, isLoaded, isReloading, Loaded, Loading, Reloading } from "../../utils/Loadable";
import { analyzeSolution, getApiAnalysis, removeSolution, setProfileSet } from "../actions/backend";

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
      draftState.solutionToSolutionDetails[action.payload.solutionDetails.solutionFilePath] = Loaded(
        action.payload.solutionDetails
      );
    })
  )
  .handleAction(analyzeSolution.failure, (state, action) =>
    produce(state, draftState => {
      draftState.solutionToSolutionDetails[action.payload.solutionPath] = Failed(action.payload.error);
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
      if (state.apiAnalysis[action.payload.solutionFile] === undefined) {
        draftState.apiAnalysis[action.payload.solutionFile] = {};
      }
      draftState.apiAnalysis[action.payload.solutionFile][action.payload.projectFile] = Loaded(action.payload);
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
