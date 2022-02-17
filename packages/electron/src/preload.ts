import { shell, contextBridge, remote } from "electron";
import path from "path";
import fs from "fs";
import process from "process";
import { invokeBackend, listenBackend } from "./preload-backend";
import { IniLoader } from "aws-sdk/global";
import { writeProfile, getTodaysDate, searchTextInFile } from "./setup";
import jsZip from "jszip";
import {
  localStore,
  nugetPackageStore,
  portingStore,
  reducerCacheStore,
} from "./preload-localStore";
import {
  Project,
  VersionPair,
} from "@porting-assistant/react/src/models/project";

contextBridge.exposeInMainWorld("electron", {
  openExternalUrl: (url: string) => shell.openExternal(url),
  openPath: (path: string) => shell.openPath(path),
  saveState: (
    key:
      | "solutions"
      | "profile"
      | "share"
      | "lastConfirmVersion"
      | "notification"
      | "newVersionNotification"
      | "email",
    value: any
  ) => localStore.set(key, value),
  getState: (
    key: "solutions" | "profile" | "targetFramework" | "share" | "email",
    defaultValue: any
  ) => localStore.get(key, defaultValue),
  saveCache: (value: any) => reducerCacheStore.set("reducerCache", value),
  getCache: (defaultValue: any) =>
    reducerCacheStore.get("reducerCache", defaultValue),
  saveNugetPackages: (value: any) =>
    nugetPackageStore.set("nugetPackages", value),
  getNugetPackages: (defaultValue: any) =>
    nugetPackageStore.get("nugetPackages", defaultValue),
  dialog: {
    showOpenDialog: (options: any) =>
      invokeBackend("dialogShowOpenDialog", options),
    showSaveDialog: (options: any) =>
      invokeBackend("dialogShowSaveDialog", options),
  },
  getFilename: (filePath: string) => {
    return path.basename(filePath);
  },
  getDirectory: (filePath: string) => {
    return path.dirname(filePath);
  },
  getRelativePath: (sourcePath: string, targetPath: string) => {
    return path.relative(path.dirname(sourcePath), targetPath);
  },
  getPathSeparator: () => {
    return path.sep;
  },
  joinPaths: (...paths: string[]) => {
    return path.join(...paths);
  },
  pathExists: (path: string) => {
    return fs.existsSync(path);
  },
  getProfiles: () => {
    try {
      const iniLoder = new IniLoader();
      return iniLoder.loadFrom({});
    } catch (err) {
      return [];
    }
  },
  writeProfile,
  writeZipFile: (
    zipFilename: string,
    contents: { filename: string; contents: string }[]
  ) => {
    return new Promise<void>(async (resolve, reject) => {
      const zip = new jsZip();
      contents.map((c) => zip.file(c.filename, c.contents));
      zip
        .generateNodeStream({ type: "nodebuffer", streamFiles: true })
        .pipe(fs.createWriteStream(zipFilename))
        .on("error", (err) => reject(err))
        .on("finish", () => resolve());
    });
  },
  verifyUser: (profile: string) => invokeBackend("verifyProfile", profile),
  getVersion: () => invokeBackend("getVersion"),
  getLatestVersion: () => invokeBackend("getLatestVersion"),
  getOutdatedVersionFlag: () => invokeBackend("getOutdatedVersionFlag"),
  telemetry: (message: any) => invokeBackend("telemetry", message),
  writeReactErrLog: (source: any, message: any, response: any) =>
    invokeBackend("writeReactErrLog", source, message, response),
  getAssessmentLog: () => {
    return path.join(
      remote.app.getPath("userData"),
      "logs",
      `portingAssistant-assessment-${getTodaysDate()}.log`
    );
  },
  checkCommonErrors: async (): Promise<
    { error: string; message: string }[]
  > => {
    const commonErrors: { error: string; message: string }[] = [
      { error: "UnauthorizedAccessException", message: "Message Text" },
      { error: "Missing MSBuild Path", message: "Message Text" },
      {
        error: "Duplicate packages in packages.config",
        message: "Message Text",
      },
    ];
    let errorsFound = [];
    try {
      const todaysBackendLog = path.join(
        remote.app.getPath("userData"),
        "logs",
        `portingAssistant-backend-${getTodaysDate()}.log`
      );
      for (const e of commonErrors) {
        if (await searchTextInFile(todaysBackendLog, e.error)) {
          errorsFound.push(e);
        }
      }
      return errorsFound;
    } catch (err) {
      console.error(err);
      return errorsFound;
    }
  },
});

contextBridge.exposeInMainWorld("backend", {
  ping: () => invokeBackend("ping"),
  analyzeSolution: (
    solutionFilePath: string,
    runId: string,
    triggerType: string,
    settings: {
      ignoreProjects: string[];
      targetFramework: string;
      continiousEnabled: boolean;
      actionsOnly: boolean;
      compatibleOnly: boolean;
    }
  ) => invokeBackend("analyzeSolution", solutionFilePath, runId, triggerType, settings),
  openSolutionInIDE: (solutionFilePath: string) =>
    invokeBackend("openSolutionInIDE", solutionFilePath),
  getFileContents: (sourceFilePath: string) =>
    invokeBackend("getFileContents", sourceFilePath),
  listenNugetPackageUpdate: (callback: (message: string) => void) =>
    listenBackend("onNugetPackageUpdate", callback),
  listenApiAnalysisUpdate: (callback: (message: string) => void) =>
    listenBackend("onApiAnalysisUpdate", callback),
  checkInternetAccess: () => invokeBackend("checkInternetAccess"),
  sendCustomerFeedback: (upload: any) => invokeBackend("sendCustomerFeedback", upload),
  uploadRuleContribution: (upload: any) => invokeBackend("uploadRuleContribution", upload)
});

contextBridge.exposeInMainWorld("porting", {
    portingStores: {},
    copyDirectory: (solutionPath: string, destinationPath: string) =>
        invokeBackend("copyDirectory",  solutionPath, destinationPath),
    getConfig: () => portingStore.get("solutions"),
    setConfig: (data: any) => portingStore.set("solutions", data),
    applyPortingProjectFileChanges: (
    projects: Project[],
    solutionPath: string,
    targetFramework: string,
    upgradeVersions: { [packageId: string]: VersionPair }
  ) =>
    invokeBackend(
      "applyPortingProjectFileChanges",
      projects,
      solutionPath,
      targetFramework,
      upgradeVersions
    ),
});

if (process.env["NODE_ENV"] === "test") {
  contextBridge.exposeInMainWorld("test", {
    clearState: () => localStore.clear(),
    clearSolutions: () => localStore.set("solutions", {}),
    addSolution: (solutionPath: string) => {
      const localStoreObj: any = localStore.get("solutions");
      localStoreObj[solutionPath] = { solutionPath: solutionPath };
      return localStore.set("solutions", localStoreObj);
    },
  });
}
