import csvStringify from "csv-stringify";
import { buffers, eventChannel } from "redux-saga";
import { all, call, put, SagaReturnType, select, take, takeEvery } from "redux-saga/effects";
import { getType } from "typesafe-actions";
import { v4 as uuid } from "uuid";

import { externalUrls } from "../../constants/externalUrls";
import { internetAccessFailed } from "../../constants/messages";
import { Message } from "../../models/error";
import { NugetPackage, PackageAnalysisResult, ProjectApiAnalysisResult, SolutionProject } from "../../models/project";
import { Response } from "../../models/response";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { isFailed, isLoaded } from "../../utils/Loadable";
import { nugetPackageKey } from "../../utils/NugetPackageKey";
import {
  analyzeSolution,
  checkCommonErrors,
  exportSolution,
  getApiAnalysis,
  init,
  openSolutionInIDE,
  ping,
  removeSolution
} from "../actions/backend";
import { pushCurrentMessageUpdate, setCurrentMessageUpdate } from "../actions/error";
import { getFileContents } from "../actions/file";
import { getNugetPackageWithData } from "../actions/nugetPackage";
import {
  selectApiAnalysis,
  selectNugetPackages,
  selectSolutionToSolutionDetails
} from "../selectors/solutionSelectors";
import {
  selectApiTableData,
  selectFileTableData,
  selectNugetTableData,
  selectProjectTableData
} from "../selectors/tableSelectors";

function nugetPackageUpdateEventEmitter() {
  return eventChannel<Response<PackageAnalysisResult, NugetPackage>>(emitter => {
    window.backend.listenNugetPackageUpdate(nugetPackage => {
      emitter(nugetPackage);
    });
    // No unsubscribe for now.
    return () => {};
  }, buffers.expanding());
}

function apiAnalysisUpdateEventEmitter() {
  return eventChannel<Response<ProjectApiAnalysisResult, SolutionProject>>(emitter => {
    window.backend.listenApiAnalysisUpdate(apiAnalysis => {
      emitter(apiAnalysis);
    });
    // No unsubscribe for now.
    return () => {};
  }, buffers.expanding());
}

export function* watchNugetPackageUpdate() {
  const channel: SagaReturnType<typeof nugetPackageUpdateEventEmitter> = yield call(nugetPackageUpdateEventEmitter);
  while (true) {
    const nugetPackage: Response<PackageAnalysisResult, NugetPackage> = yield take(channel);
    if (nugetPackage.status.status === "Success") {
      yield put(getNugetPackageWithData.success(nugetPackage.value));
    } else {
      yield put(
        getNugetPackageWithData.failure({
          nugetPackage: nugetPackage.errorValue,
          error: nugetPackage.status.error
        })
      );
    }
  }
}

export function* watchApiAnalysisUpdate() {
  const channel: SagaReturnType<typeof apiAnalysisUpdateEventEmitter> = yield call(apiAnalysisUpdateEventEmitter);
  while (true) {
    let projectApiAnalysis: Response<ProjectApiAnalysisResult, SolutionProject> = yield take(channel);
    if (projectApiAnalysis.status.status === "Success") {
      yield put(getApiAnalysis.success(projectApiAnalysis.value));
    } else {
      yield put(
        getApiAnalysis.failure({
          projectFile: projectApiAnalysis.errorValue.projectPath,
          solutionFile: projectApiAnalysis.errorValue.solutionPath,
          error: projectApiAnalysis.status.error
        })
      );
    }
  }
}

function* handleInit(action: ReturnType<typeof init>) {
  yield put(ping());
  const haveInternet: boolean = yield window.backend.checkInternetAccess();
  const storedSolutions = window.electron.getState("solutions", {});
  const targetFramework = getTargetFramework();
  if (!haveInternet) {
    yield put(pushCurrentMessageUpdate(internetAccessFailed()));
  }
  for (const solution of Object.keys(storedSolutions)) {
    if (haveInternet) {
      yield put(
        analyzeSolution.request({
          solutionPath: solution,
          runId: uuid(),
          triggerType: "AutoRequest",
          settings: {
            ignoredProjects: [],
            targetFramework: targetFramework,
            continiousEnabled: false,
            actionsOnly: false,
            compatibleOnly: false
          },
          force: action.payload
        })
      );
    } else {
      yield put(
        analyzeSolution.failure({
          error: "Cannot analyze solution witout internet connectivity",
          solutionPath: solution
        })
      );
    }
  }
}

function* handlePing() {
  try {
    const response = yield window.backend.ping();
    if (response === "pong") {
      return true;
    }
  } catch (err) {}
  yield put(
    setCurrentMessageUpdate([
      {
        messageId: uuid(),
        groupId: "pingFailed",
        type: "error",
        header: "An unexpected error occured",
        content: "Ensure that you have all prerequisites installed. Restart Porting Assistant for .NET afterwards.",
        buttonText: "View prerequisites",
        onButtonClick: () => window.electron.openExternalUrl(externalUrls.prereq)
      }
    ])
  );
}

function* handleCheckCommonErrors(action: ReturnType<typeof checkCommonErrors>) {
  const start: Date = action.payload;
  try {
        const errorsFound: { error: string; message: string }[] = yield window.electron.checkCommonErrors(
          start,
          window.electron.getBackendLog()
        );
        for (const error of errorsFound) {
          yield put(
            pushCurrentMessageUpdate({
              messageId: uuid(),
              type: "warning",
              header: error.error,
              content: error.message,
              dismissible: true
            })
          );
        }
      } catch (e) {
    console.log(e);
  }
}

function* handleAnalyzeSolution(action: ReturnType<typeof analyzeSolution.request>) {
  yield put(ping());
  const start = new Date();
  try {
    const currentSolutionPath = action.payload.solutionPath;
    const solutionToSolutionDetails: ReturnType<typeof selectSolutionToSolutionDetails> = yield select(
      selectSolutionToSolutionDetails
    );
    const solution = solutionToSolutionDetails[currentSolutionPath];
    const solutionToApiAnalysis: ReturnType<typeof selectApiAnalysis> = yield select(selectApiAnalysis);
    const apiAnalysis = solutionToApiAnalysis[currentSolutionPath];
    const nugetPackages: ReturnType<typeof selectNugetPackages> = yield select(selectNugetPackages);

    const isNugetPackageLoaded = (n: NugetPackage) => {
      const key = nugetPackageKey(n.packageId, n.version);
      return isLoaded(nugetPackages[key]) || isFailed(nugetPackages[key]);
    };

    if (
      isLoaded(solution) &&
      apiAnalysis != null &&
      Object.values(apiAnalysis).every(a => isLoaded(a) || isFailed(a)) &&
      solution.data.projects.reduce(
        (agg, p) => agg && p.packageReferences?.every(n => isNugetPackageLoaded(n)) === true,
        true
      ) &&
      action.payload.force !== true
    ) {
      return;
    }
    const solutionDetails: SagaReturnType<typeof window.backend.analyzeSolution> = yield call(
      [window.backend, window.backend.analyzeSolution],
      currentSolutionPath,
      action.payload.runId,
      action.payload.triggerType,
      action.payload.settings
    );

    if (solutionDetails.status.status === "Success") {
      const solutions = window.electron.getState("solutions");
      if (!Object.keys(solutions).includes(solutionDetails.value.solutionFilePath)) {
        return;
      }
      solutions[solutionDetails.value.solutionFilePath].lastAssessedDate = new Date().toUTCString();
      window.electron.saveState("solutions", solutions);
      yield put(analyzeSolution.success({ solutionDetails: solutionDetails.value }));
    } else {
      yield put(
        analyzeSolution.failure({
          error: solutionDetails.status.error,
          solutionPath: action.payload.solutionPath
        })
      );
    }
  } catch (e) {
    yield put(analyzeSolution.failure({ solutionPath: action.payload.solutionPath, error: e }));
  }
  yield put(checkCommonErrors(start));
}

function* handleGetFileContents(action: ReturnType<typeof getFileContents.request>) {
  try {
    const sourceFilePath = action.payload;
    const fileContents: SagaReturnType<typeof window.backend.getFileContents> = yield call(
      [window.backend, window.backend.getFileContents],
      sourceFilePath
    );
    yield put(getFileContents.success({ sourceFilePath: action.payload, fileContents }));
  } catch (e) {
    yield put(getFileContents.failure({ sourceFilePath: action.payload, error: e }));
  }
}

function handleRemoveSolution(action: ReturnType<typeof removeSolution>) {
  const paths = window.electron.getState("solutions", {});
  delete paths[action.payload];
  window.electron.saveState("solutions", paths);
}

function* handleOpenSolutionInIDE(action: ReturnType<typeof openSolutionInIDE>) {
  const solutionFilePath = action.payload;
  const response: SagaReturnType<typeof window.backend.openSolutionInIDE> = yield call(
    [window.backend, window.backend.openSolutionInIDE],
    solutionFilePath
  );
  if (response.status.status === "Success") {
    yield put(
      pushCurrentMessageUpdate({
        messageId: uuid(),
        groupId: "OpenInVS",
        content: `Successfully opened ${window.electron.getFilename(solutionFilePath)} in Visual Studio.`,
        type: "success",
        dismissible: true
      })
    );
  } else {
    let message: Message = {
      messageId: uuid(),
      groupId: "OpenInVS",
      content: `Failed to Open ${window.electron.getFilename(solutionFilePath)} in Visual Studio.`,
      type: "error",
      dismissible: true
    };
    if (response.errorValue === "A valid installation of Visual Studio was not found") {
      message.content = response.errorValue;
    }
    yield put(pushCurrentMessageUpdate(message));
  }
}

function* handleExportSolution(action: ReturnType<typeof exportSolution>) {
  const filename: SagaReturnType<typeof window.electron.dialog.showSaveDialog> = yield call(
    [window.electron.dialog, window.electron.dialog.showSaveDialog],
    {
      title: "Export assessment report",
      buttonLabel: "Export",
      showsTagField: false,
      filters: [{ name: "*.zip", extensions: ["zip"] }]
    }
  );
  if (filename.canceled || filename.filePath == null) {
    return;
  }
  const filePath = filename.filePath;
  const solutionUrl = `/solutions/${encodeURIComponent(action.payload.solutionPath)}`;
  const projectData: SagaReturnType<typeof selectProjectTableData> = yield select(state =>
    selectProjectTableData(state, solutionUrl)
  );
  const nugetData: SagaReturnType<typeof selectNugetTableData> = yield select(state =>
    selectNugetTableData(state, solutionUrl)
  );
  const fileData: SagaReturnType<typeof selectFileTableData> = yield select(state =>
    selectFileTableData(state, solutionUrl)
  );
  const apiData: SagaReturnType<typeof selectApiTableData> = yield select(state =>
    selectApiTableData(state, solutionUrl)
  );
  const exportCsv = async (data: any[]) => {
    if (data.length === 0 || data == null) return Promise.resolve("");
    return new Promise<string>((resolve, reject) =>
      csvStringify([Object.keys(data[0]), ...data.map(d => Object.values(d))], (err, output) => {
        if (err || output == null) {
          reject(err);
        }
        resolve(output);
      })
    );
  };

  const apiWithinFiles = apiData?.reduce((agg, cur) => {
    cur.locations.forEach(source => {
      agg.push({
        apiName: cur.apiName,
        packageName: cur.packageName,
        packageVersion: cur.packageVersion,
        sourceFiles: source.sourcefilePath,
        startLine: source.location,
        replacement: cur.replacement,
        isCompatible: cur.isCompatible,
        deprecated: cur.deprecated
      });
    });
    return agg;
  }, Array<any>());

  try {
    const { project, nuget, file, api } = yield all({
      project: exportCsv(projectData),
      nuget: exportCsv(nugetData),
      file: exportCsv(fileData || []),
      api: exportCsv(apiWithinFiles || [])
    });

    yield call([window.electron, window.electron.writeZipFile], filePath, [
      { filename: "projects.csv", contents: project },
      { filename: "nugetPackages.csv", contents: nuget },
      { filename: "sourceFiles.csv", contents: file },
      { filename: "apis.csv", contents: api }
    ]);

    yield put(
      pushCurrentMessageUpdate({
        messageId: uuid(),
        type: "success",
        dismissible: true,
        content: `Successfully exported ${filePath}`
      })
    );
  } catch (err) {
    yield put(
      pushCurrentMessageUpdate({
        messageId: uuid(),
        type: "error",
        dismissible: true,
        content: `Failed to export ${filePath}`
      })
    );
  }
}

function* watchInit() {
  yield takeEvery(getType(init), handleInit);
}

function* watchPing() {
  yield takeEvery(getType(ping), handlePing);
}

function* watchAnalyzeSolution() {
  yield takeEvery(getType(analyzeSolution.request), handleAnalyzeSolution);
}

function* watchGetFileContents() {
  yield takeEvery(getType(getFileContents.request), handleGetFileContents);
}

function* watchExportSolution() {
  yield takeEvery(getType(exportSolution), handleExportSolution);
}

function* watchRemoveSolution() {
  yield takeEvery(getType(removeSolution), handleRemoveSolution);
}

function* watchOpenInIDE() {
  yield takeEvery(getType(openSolutionInIDE), handleOpenSolutionInIDE);
}

function* watchCheckCommonErrors() {
  yield takeEvery(getType(checkCommonErrors), handleCheckCommonErrors);
}

export default function* backendSaga() {
  yield all([
    watchInit(),
    watchAnalyzeSolution(),
    watchApiAnalysisUpdate(),
    watchNugetPackageUpdate(),
    watchGetFileContents(),
    watchExportSolution(),
    watchRemoveSolution(),
    watchOpenInIDE(),
    watchPing(),
    watchCheckCommonErrors()
  ]);
}
