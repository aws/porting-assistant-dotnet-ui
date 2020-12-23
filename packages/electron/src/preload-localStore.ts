import Store from "electron-store";
import { JSONSchema } from "json-schema-typed";
import path from "path";
import os from "os";
import fs from "fs";
import { app } from "electron";

const PortingLocation: JSONSchema = {
  type: "object",
  properties: {
    type: { enum: ["inplace", "copy"] },
  },
  allOf: [
    {
      if: {
        properties: { type: { const: "inplace" } },
      },
      then: {
        properties: {},
      },
    },
    {
      if: {
        properties: { type: { const: "copy" } },
      },
      then: {
        properties: {
          workingDirectory: { type: "string" },
        },
      },
    },
  ],
};

const StepStatusEnum: JSONSchema = { enum: ["incomplete", "complete"] };

const createLocalStore = () =>
  new Store({
    defaults: {
      solutions: {},
      profile: "",
      targetFramework: { label: ".NET Core 3.1.0", id: "netcoreapp3.1" },
      share: false,
      lastConfirmVersion: ""
    },
    accessPropertiesByDotNotation: false,
    schema: {
      solutions: {
        type: "object",
        patternProperties: {
          ".sln$": {
            type: "object",
            required: ["solutionPath"],
            properties: {
              solutionPath: { type: "string" },
              porting: {
                type: "object",
                properties: { portingLocation: PortingLocation },
              },
            },
          },
        },
        additionalProperties: false,
      },
      profile: {
        type: "string",
      },
      targetFramework: {
        type: "object",
        properties: {
          label: { type: "string" },
          id: { type: "string" },
        },
      },
      share: {
        type: "boolean",
      },
      lastConfirmVersion: {
        type: "string"
      }
    },
    watch: true,
    cwd:
      process.env["NODE_ENV"] === "test"
        ? os.platform() !== "win32"
          ? path.join(__dirname, "..", "test_store")
          : path.join(
              os.homedir(),
              "AppData",
              "Roaming",
              "Porting Assistant for .NET"
            )
        : undefined,
  });

const createReducerCacheStore = () =>
  new Store({
    defaults: {
      reducerCache: {},
    },
    accessPropertiesByDotNotation: false,
    schema: {
      reducerCache: require(path.join(
        __dirname,
        "..",
        "schema",
        "solution-reducer"
      )),
    },
    name: "reducer-cache-1.3.0",
    clearInvalidConfig: true,
    cwd:
      process.env["NODE_ENV"] === "test"
        ? os.platform() !== "win32"
          ? path.join(__dirname, "..", "test_store")
          : path.join(
              os.homedir(),
              "AppData",
              "Roaming",
              "Porting Assistant for .NET"
            )
        : undefined,
  });

const createPortingStore = () =>
  new Store({
    name: "porting",
    accessPropertiesByDotNotation: false,
    defaults: {
      solutions: {},
    },
    schema: {
      solutions: {
        type: "object",
        patternProperties: {
          ".sln$": {
            type: "object",
            patternProperties: {
              ".csproj$": {
                type: "object",
                required: ["projectPath"],
                properties: {
                  projectPath: { type: "string" },
                  steps: {
                    type: "object",
                    properties: { projectFileStep: StepStatusEnum },
                  },
                },
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    },
  });

const createNugetPackageStore = () =>
  new Store({
    defaults: {
      nugetPackages: {},
    },
    accessPropertiesByDotNotation: false,
    schema: {
      nugetPackages: require(path.join(
        __dirname,
        "..",
        "schema",
        "nuget-reducer"
      )),
    },
    name: "nuget-packages",
    clearInvalidConfig: true,
    cwd:
      process.env["NODE_ENV"] === "test"
        ? os.platform() !== "win32"
          ? path.join(__dirname, "..", "test_store")
          : path.join(
              os.homedir(),
              "AppData",
              "Roaming",
              "Porting Assistant for .NET"
            )
        : undefined,
  });

const getStore = (storeFactory: () => Store<any>, configFilename: string) => {
  try {
    return storeFactory();
  } catch (e) {
    try {
      fs.unlinkSync(
        path.join(app.getPath("userData"), `${configFilename}.json`)
      );
    } catch (deleteEx) {}
    return storeFactory();
  }
};

export const localStore = getStore(createLocalStore, "config");

export const reducerCacheStore = getStore(
  createReducerCacheStore,
  "reducer-cache"
);

export const nugetPackageStore = getStore(
  createNugetPackageStore,
  "nuget-packages"
);

export const portingStore = getStore(createPortingStore, "porting");
