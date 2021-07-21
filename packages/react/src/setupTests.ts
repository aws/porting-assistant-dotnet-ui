import { LocalStoreSchema } from "./models/localStoreSchema";
import { Credentials } from "./models/setup";
import { NugetPackageReducerState, SolutionReducerState } from "./store/reducers";

global.window = {
  electron: {
    openExternalUrl: (url: string) => null,
    openPath: (path: string) => null,
    callBackend: (channel: string, ...args: any) => {
      throw new Error("not implement");
    },
    saveState: <K extends keyof LocalStoreSchema>(key: K, value: LocalStoreSchema[K]) => null,
    getState: <K extends keyof LocalStoreSchema>(key: K, defaultValue?: LocalStoreSchema[K]) => {
      throw new Error("not implement");
    },
    saveCache: (value: SolutionReducerState) => null,
    getCache: () => {
      throw new Error("not implement");
    },
    saveNugetPackages: (value: NugetPackageReducerState) => null,
    getNugetPackages: () => {
      throw new Error("not implement");
    },
    getFilename: (filePath: string) => "test",
    getDirectory: (filePath: string) => "test",
    getRelativePath: (sourcePath: string, targetPath: string) => "test",
    getPathSeparator: () => "test",
    joinPaths: (...paths: string[]) => "test",
    getProfiles: () => {
      return {
        rest: {
          aws_access_key_id: "xxx",
          aws_secret_access_key: "xxxx"
        }
      };
    },
    writeProfile: (profileName: string, credentials: Credentials) => null,
    writeZipFile: () => {
      throw new Error("not implement");
    },
    dialog: {} as any
  }
} as any;
