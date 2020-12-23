import { TypedUseSelectorHook, useSelector } from "react-redux";
import { applyMiddleware, createStore, Middleware } from "redux";
import { createLogger } from "redux-logger";
import createSagaMiddleware from "redux-saga";
import { isActionOf } from "typesafe-actions";

import {
  PackageToPackageAnalysisResult,
  SolutionToApiAnalysis,
  SolutionToSolutionDetails,
  SourceFileToContents
} from "./models/project";
import { RootAction as RA } from "./store/actions";
import { analyzeSolution, getApiAnalysis, removeSolution } from "./store/actions/backend";
import { getNugetPackageWithData } from "./store/actions/nugetPackage";
import { removePortedSolution } from "./store/actions/porting";
import { createRootReducer, RootState as RS } from "./store/reducers";
import { SolutionToPortingLocation } from "./store/reducers/porting";
import createRootSaga from "./store/sagas";
import { isLoaded } from "./utils/Loadable";

declare module "typesafe-actions" {
  export type RootAction = RA;
  export type RootState = RS;
  interface Types {
    RootAction: RootAction;
    RootState: RootState;
  }
}

const logger = createLogger({
  level: "info"
});

const cacheActions = [analyzeSolution.success, getApiAnalysis.success, removeSolution];
const nugetCacheActions = [getNugetPackageWithData.success];
const portCacheActions = [removePortedSolution];

function debounce<F extends (...args: any[]) => void>(
  func: F,
  wait: number
): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this;
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
const debounceSaveCache = debounce(window.electron.saveCache, 5 * 1000);
const debounceSaveNuget = debounce(window.electron.saveNugetPackages, 5 * 1000);
const debounceSavePort = debounce(window.porting.setConfig, 5 * 1000);

const cacheStateMiddleware: Middleware<{}, RS> = store => next => action => {
  const result = next(action);

  if (isActionOf(cacheActions)(action)) {
    const { apiAnalysis, solutionToSolutionDetails } = store.getState().solution;
    debounceSaveCache({ apiAnalysis, solutionToSolutionDetails });
  }
  if (isActionOf(nugetCacheActions)(action)) {
    debounceSaveNuget(store.getState().nugetPackage);
  }
  if (isActionOf(portCacheActions)(action)) {
    debounceSavePort(store.getState().porting.portingProjects);
  }
  return result;
};

const getStateFromCache = (): Partial<RS> => {
  const storedSolutions = window.electron.getState("solutions");
  const defaultPortingLocations = Object.values(storedSolutions || {}).reduce((agg, sol) => {
    if (sol.porting?.portingLocation != null) {
      agg[sol.solutionPath] = sol.porting.portingLocation;
    }
    return agg;
  }, {} as SolutionToPortingLocation);
  const { apiAnalysis, solutionToSolutionDetails } = window.electron.getCache();
  const filteredSolutionToSolutionDetails = Object.values(solutionToSolutionDetails || {}).reduce((agg, sol) => {
    if (isLoaded(sol) && storedSolutions[sol.data.solutionFilePath] != null) {
      agg[sol.data.solutionFilePath] = sol;
    }
    return agg;
  }, {} as SolutionToSolutionDetails);
  const profile = window.electron.getState("profile");
  const share = window.electron.getState("share");
  const lastConfirmVersion = window.electron.getState("lastConfirmVersion");
  return {
    solution: {
      apiAnalysis: Object.assign({} as SolutionToApiAnalysis, apiAnalysis),
      solutionToSolutionDetails: Object.assign({} as SolutionToSolutionDetails, filteredSolutionToSolutionDetails),
      profileSet: profile != null && profile.length > 0 && share === true && lastConfirmVersion === "1.3.0"
    },
    nugetPackage: Object.assign(
      {
        nugets: {} as PackageToPackageAnalysisResult
      },
      window.electron.getNugetPackages()
    ),
    file: {
      sourceFileToContents: {} as SourceFileToContents
    },
    porting: {
      portingLocations: defaultPortingLocations,
      portingProjects: Object.assign({}, window.porting.getConfig())
    }
  };
};

export const createReduxStore = () => {
  const sagaMiddleware = createSagaMiddleware();
  const enhancer = applyMiddleware(logger, sagaMiddleware, cacheStateMiddleware);
  const store = createStore(createRootReducer(), getStateFromCache(), enhancer);
  sagaMiddleware.run(createRootSaga());
  return store;
};

export const usePortingAssistantSelector: TypedUseSelectorHook<RS> = useSelector;
