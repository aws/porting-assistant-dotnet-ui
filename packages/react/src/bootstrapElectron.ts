import { Dialog } from "electron";

import { LocalStoreSchema } from "./models/localStoreSchema";
import { PortingProjectFileResult } from "./models/porting";
import {
  NugetPackage,
  PackageAnalysisResult,
  Project,
  ProjectApiAnalysisResult,
  SolutionProject,
  VersionPair
} from "./models/project";
import { Response } from "./models/response";
import { Credentials } from "./models/setup";
import { Profiles } from "./models/setup";
import { SolutionDetails } from "./models/solution";
import { NugetPackageReducerState, SolutionReducerState } from "./store/reducers";
import { SolutionToPortingProjects } from "./store/reducers/porting";

export interface Electron {
  openExternalUrl: (url: string) => void;
  openPath: (path: string) => void;
  callBackend: (channel: string, ...args: any) => Promise<any>;
  saveState: <K extends keyof LocalStoreSchema>(key: K, value: LocalStoreSchema[K]) => void;
  getState: <K extends keyof LocalStoreSchema>(key: K, defaultValue?: LocalStoreSchema[K]) => LocalStoreSchema[K];
  saveCache: (value: Pick<SolutionReducerState, "apiAnalysis" | "solutionToSolutionDetails">) => void;
  getCache: () => Pick<SolutionReducerState, "apiAnalysis" | "solutionToSolutionDetails">;
  saveNugetPackages: (value: NugetPackageReducerState) => void;
  getNugetPackages: () => NugetPackageReducerState;
  dialog: Dialog;
  getFilename: (filePath: string) => string;
  getDirectory: (filePath: string) => string;
  getRelativePath: (sourcePath: string, targetPath: string) => string;
  getPathSeparator: () => string;
  joinPaths: (...paths: string[]) => string;
  pathExists: (path: string) => boolean;
  getProfiles: () => Profiles;
  writeProfile: (profileName: string, credentials: Credentials) => void;
  writeZipFile: (zipFilename: string, contents: { filename: string; contents: string }[]) => Promise<void>;
  verifyUser: (profile: string) => Promise<boolean>;
  getVersion: () => Promise<string>;
  telemetry: (message: any) => void;
}

export interface Backend {
  ping: () => Promise<string>;
  analyzeSolution: (
    solutionPath: string,
    settings: {
      ignoredProjects: string[];
      targetFramework: string;
      continiousEnabled: boolean;
      actionsOnly: boolean;
      compatibleOnly: boolean;
    }
  ) => Promise<Response<SolutionDetails, string>>;
  openSolutionInIDE: (solutionFilePath: string) => Promise<Response<boolean, string>>;
  getFileContents: (sourceFilePath: string) => Promise<string>;
  getNugetPackages: (packageVersions: NugetPackage[], solutionPath: string) => Promise<Response<string, string>>;
  listenNugetPackageUpdate: (callback: (nugetPackage: Response<PackageAnalysisResult, NugetPackage>) => void) => void;
  listenApiAnalysisUpdate: (
    callback: (projectAnalysis: Response<ProjectApiAnalysisResult, SolutionProject>) => void
  ) => void;
}

export interface Porting {
  copyDirectory: (solutionPath: string, destinationPath: string) => Promise<void>;
  getConfig: () => SolutionToPortingProjects;
  setConfig: (data: SolutionToPortingProjects) => void;
  applyPortingProjectFileChanges: (
    projectPaths: Project[],
    solutionPath: string,
    targetFramework: string,
    upgradeVersions: { [packageId: string]: VersionPair }
  ) => Promise<Response<PortingProjectFileResult[], PortingProjectFileResult[]>>;
}

declare global {
  interface Window {
    electron: Electron;
    backend: Backend;
    porting: Porting;
    reduxStore: any;
  }
}
