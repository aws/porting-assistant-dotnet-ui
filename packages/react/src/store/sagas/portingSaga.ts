import { all, put, SagaReturnType, takeEvery } from "redux-saga/effects";
import { getType, PayloadAction } from "typesafe-actions";

import { setAllPortingProjectConfig, setPortingLocation, setPortingProjectConfig } from "../actions/porting";
import { setPortingProject } from "../reducers/porting";

function* handleSetPortingLocation(action: PayloadAction<string, any>) {
  const paths = yield window.electron.getState("solutions", {});
  if (action.payload.portingLocation != null) {
    paths[action.payload.solutionPath].porting = { portingLocation: action.payload.portingLocation };
  } else {
    paths[action.payload.solutionPath].porting = undefined;
  }
  yield window.electron.saveState("solutions", paths);
}

function* handleSetPortingProjectConfig(action: ReturnType<typeof setPortingProjectConfig>) {
  const projectPath = window.electron.getRelativePath(action.payload.solutionPath, action.payload.projectPath);
  switch (action.payload.portingLocation.type) {
    case "copy":
      const workingDirectoryPortingProject: SagaReturnType<typeof window.porting.getConfig> = yield window.porting.getConfig();
      setPortingProject(workingDirectoryPortingProject, projectPath, action);
      yield window.porting.setConfig(workingDirectoryPortingProject);
      yield put(setAllPortingProjectConfig(workingDirectoryPortingProject));
      break;
    case "inplace":
      const inplaceWorkingDirectory: SagaReturnType<typeof window.porting.getConfig> = yield window.porting.getConfig();
      setPortingProject(inplaceWorkingDirectory, projectPath, action);
      yield window.porting.setConfig(inplaceWorkingDirectory);
      yield put(setAllPortingProjectConfig(inplaceWorkingDirectory));
  }
}

function* watchSetPortingLocation() {
  yield takeEvery(getType(setPortingLocation), handleSetPortingLocation);
}

function* watchSetPortingProjectConfig() {
  yield takeEvery(getType(setPortingProjectConfig), handleSetPortingProjectConfig);
}

export default function* portingSaga() {
  yield all([watchSetPortingLocation(), watchSetPortingProjectConfig()]);
}
