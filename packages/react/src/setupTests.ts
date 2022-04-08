import Enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import fs from "fs";

import { LocalStoreSchema } from "./models/localStoreSchema";
import { Credentials } from "./models/setup";
import { NugetPackageReducerState, SolutionReducerState } from "./store/reducers";

Enzyme.configure({
  adapter: new Adapter(),
});

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
    getProfiles: jest.fn().mockReturnValue(Promise.resolve({configFile: {}, credentialsFile: {}})),
    getCredentials: jest.fn().mockReturnValue(Promise.resolve({
      accessKeyId: "accessKeyID_selectedProfileTest",
      secretAccessKey: "secretAccessKey_selectedProfileTest",
      sessionToken: "sessionToken_selectedProfileTest"
    })),
    writeProfile: (profileName: string, credentials: Credentials) => null,
    writeZipFile: () => {
      throw new Error("not implement");
    },
    dialog: {} as any
  },
  backend: {
      checkInternetAccess: () => false,
      getFileContents: (solutionFilePath: string) => {
        const fileContents = fs.readFileSync(solutionFilePath).toString();
        return fileContents;
      }
  }
} as any;
