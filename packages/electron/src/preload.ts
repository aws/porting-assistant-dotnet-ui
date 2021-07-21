import { shell, contextBridge, remote } from "electron";
import path from "path";
import fs from "fs";
import process from "process";
import { invokeBackend, listenBackend } from "./preload-backend";
import { copyDirectory } from "./preload-porting";
import { IniLoader } from "aws-sdk/global";
import { writeProfile } from "./setup";
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
import axios from "axios";
import isDev from "electron-is-dev";

contextBridge.exposeInMainWorld("electron", {
  openExternalUrl: (url: string) => shell.openExternal(url),
  openPath: (path: string) => shell.openPath(path),
  saveState: (
    key:
      | "solutions"
      | "profile"
      | "share"
      | "lastConfirmVersion"
      | "notification",
    value: any
  ) => localStore.set(key, value),
  getState: (
    key: "solutions" | "profile" | "targetFramework" | "share",
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
  telemetry: (message: any) => invokeBackend("telemetry", message),
  getAssessmentLog: () => {
    const dateString = new Date().toISOString().slice(0,10).replace(/-/g,"");
    return path.join(remote.app.getPath("userData"), "logs", `portingAssistant-assessment-${dateString}.log`);
  }
});

contextBridge.exposeInMainWorld("backend", {
  ping: () => invokeBackend("ping"),
  analyzeSolution: (
    solutionFilePath: string,
    settings: {
      ignoreProjects: string[];
      targetFramework: string;
      continiousEnabled: boolean;
      actionsOnly: boolean;
      compatibleOnly: boolean;
    }
  ) => invokeBackend("analyzeSolution", solutionFilePath, settings),
  openSolutionInIDE: (solutionFilePath: string) =>
    invokeBackend("openSolutionInIDE", solutionFilePath),
  getFileContents: (sourceFilePath: string) =>
    invokeBackend("getFileContents", sourceFilePath),
  listenNugetPackageUpdate: (callback: (message: string) => void) =>
    listenBackend("onNugetPackageUpdate", callback),
  listenApiAnalysisUpdate: (callback: (message: string) => void) =>
    listenBackend("onApiAnalysisUpdate", callback),
  checkInternetAccess: () => invokeBackend("checkInternetAccess"),
});

contextBridge.exposeInMainWorld("porting", {
  portingStores: {},
  copyDirectory: (solutionPath: string, destinationPath: string) =>
    copyDirectory(solutionPath, destinationPath),
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
