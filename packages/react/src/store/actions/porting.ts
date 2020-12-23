import { createAction, createAsyncAction } from "typesafe-actions";

import { PortingLocation, PortingProject } from "../../models/porting";
import { Project } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { SolutionToPortingProjects } from "../reducers/porting";

export interface SetPortingLocationPayload {
  solutionPath: string;
  portingLocation: PortingLocation | undefined;
}
export const setPortingLocation = createAction("setPortingLocation")<SetPortingLocationPayload>();

export interface SetPortingProjectConfig {
  solutionPath: string;
  projectPath: string;
  portingLocation: PortingLocation;
  config: Partial<PortingProject>;
}
export const setPortingProjectConfig = createAction("setPortingProjectConfig")<SetPortingProjectConfig>();

export const removePortedSolution = createAction("removePortedSolution")<string>();

export const setAllPortingProjectConfig = createAction("setAllPortingProjectConfig")<SolutionToPortingProjects>();

export interface PortProjectRequestPayload {
  solution: SolutionDetails;
  projects: Project[];
  targetFramework: string;
  nugetPackageUpgrades: { [packageId: string]: string };
}
export const portProjects = createAsyncAction("portProject_Request", "portProject_Success", "portProject_Failure")<
  PortProjectRequestPayload,
  void,
  Error
>();
