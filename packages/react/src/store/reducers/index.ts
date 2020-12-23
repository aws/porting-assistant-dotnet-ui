import { combineReducers } from "redux";
import { StateType } from "typesafe-actions";

import { backendReducer } from "./backend";
import { errorReducer } from "./error";
import { fileReducer } from "./file";
import { nugetPackageReducer } from "./nugetPackage";
import { portingReducer } from "./porting";
import { toolsReducer } from "./tools";

export const createRootReducer = () =>
  combineReducers({
    solution: backendReducer,
    porting: portingReducer,
    nugetPackage: nugetPackageReducer,
    file: fileReducer,
    error: errorReducer,
    tools: toolsReducer
  });

export type RootState = StateType<ReturnType<typeof createRootReducer>>;

export type SolutionReducerState = StateType<typeof backendReducer>;
export type NugetPackageReducerState = StateType<typeof nugetPackageReducer>;
export type PortingReducerState = StateType<typeof portingReducer>;
