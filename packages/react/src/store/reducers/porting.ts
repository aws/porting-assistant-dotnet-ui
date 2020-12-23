import { produce } from "immer";
import { createReducer } from "typesafe-actions";

import { PortingLocation, PortingProjects } from "../../models/porting";
import {
  removePortedSolution,
  setAllPortingProjectConfig,
  setPortingLocation,
  setPortingProjectConfig
} from "../actions/porting";

export type SolutionToPortingLocation = { [solutionPath: string]: PortingLocation };
export type SolutionToPortingProjects = { [solutionPath: string]: PortingProjects };

export const setPortingProject = (
  portingProjects: SolutionToPortingProjects,
  projectPath: string,
  action: ReturnType<typeof setPortingProjectConfig>
) => {
  if (portingProjects[action.payload.solutionPath] == null) {
    portingProjects[action.payload.solutionPath] = {};
  }
  if (portingProjects[action.payload.solutionPath][projectPath] == null) {
    portingProjects[action.payload.solutionPath][projectPath] = { projectPath };
  }
  if (action.payload.config.steps != null) {
    portingProjects[action.payload.solutionPath][projectPath].steps = {
      ...portingProjects[action.payload.solutionPath][projectPath].steps,
      ...action.payload.config.steps
    };
  }
};

export const portingReducer = createReducer({
  portingLocations: {} as SolutionToPortingLocation,
  portingProjects: {} as SolutionToPortingProjects
})
  .handleAction(setPortingLocation, (state, action) =>
    produce(state, draftState => {
      if (action.payload.portingLocation != null) {
        draftState.portingLocations[action.payload.solutionPath] = action.payload.portingLocation;
      } else {
        delete draftState.portingLocations[action.payload.solutionPath];
      }
    })
  )
  .handleAction(removePortedSolution, (state, action) =>
    produce(state, draftstate => {
      delete draftstate.portingProjects[action.payload];
      delete draftstate.portingLocations[action.payload];
    })
  )
  .handleAction(setAllPortingProjectConfig, (state, action) =>
    produce(state, draftState => {
      draftState.portingProjects = action.payload;
    })
  );
