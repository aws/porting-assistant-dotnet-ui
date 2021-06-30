import { ipcMain, app, dialog } from "electron";
import { ConnectionBuilder } from "electron-cgi";
import path from "path";
import isDev from "electron-is-dev";
import fs from "fs";
import { Connection } from "electron-cgi/connection";
import { testProfile } from "./telemetry/electron-metrics";
import {
  startTimer,
  logSolutionMetrics,
  logReactMetrics,
  registerLogListeners,
} from "./telemetry/electron-telemetry";
import { localStore } from "./preload-localStore";

ipcMain.handle("verifyProfile", (_event, profile: string) => {
  return testProfile(profile);
});
ipcMain.handle("getConfigPath", (_event) => {
  return app.getPath("userData");
});

export const initConnection = (logger: any = console) => {
  ipcMain.handle("ping", async (_event) => {
    if (instance === undefined) {
      throw Error("Backend not initialized");
    }
    return "pong";
  });

  ipcMain.handle("getFileContents", async (_event, sourceFilePath) => {
    try {
      const contents = await fs.promises.readFile(sourceFilePath);
      return contents.toString();
    } catch (ex) {
      throw new Error(`Unable to read file ${sourceFilePath}. ${ex}`);
    }
  });

  ipcMain.handle("getVersion", async (_event) => {
    return app.getVersion();
  });

  ipcMain.handle("telemetry", async (_event, message) => {
    logReactMetrics(message);
  });
  ipcMain.handle("dialogShowOpenDialog", (_event, options: any) =>
    dialog.showOpenDialog(options)
  );
  ipcMain.handle("dialogShowSaveDialog", (_event, options: any) =>
    dialog.showSaveDialog(options)
  );

  let instance: Connection | undefined = undefined;

  const createConnection = (browserWindow: Electron.BrowserWindow) => {
    const connection = new ConnectionBuilder()
      .connectTo(
        "dotnet",
        isDev
          ? path.join(
              __dirname,
              "..",
              "netcore_build",
              "PortingAssistant.Api.dll"
            )
          : path.join(
              path.dirname(app.getPath("exe")),
              "resources",
              "netcore_build",
              "PortingAssistant.Api.dll"
            ),
        isDev
          ? path.join(
              __dirname,
              "..",
              "build-scripts",
              "porting-assistant-config.dev.json"
            )
          : path.join(
              path.dirname(app.getPath("exe")),
              "resources",
              "config",
              "porting-assistant-config.json"
            ),
        localStore.get("profile"),
        app.getPath("userData"),
        app.getVersion()
      )
      .build();

    connection.onDisconnect = () => {
      // Recreate connection on disconnect
      logger.log("disconnected");
      instance = undefined;
    };

    ipcMain.handle(
      "analyzeSolution",
      async (_event, solutionFilePath, settings) => {
        const request = { solutionFilePath, settings };
        const elapseTime = startTimer();
        logger.log(`REQUEST - analyzeSolution: ${JSON.stringify(request)}`);
        const response = await connection.send("analyzeSolution", request);
        logger.log(`RESPONSE - analyzeSolution: ${JSON.stringify(response)}`);
        logSolutionMetrics(response, elapseTime());
        return response;
      }
    );

    ipcMain.handle(
      "applyPortingProjectFileChanges",
      async (
        _event,
        projects,
        solutionPath,
        targetFramework,
        upgradeVersions
      ) => {
        const RecommendedActions = Object.keys(upgradeVersions).map((key) => {
          return {
            PackageId: key,
            Version: upgradeVersions[key].originalVersion,
            TargetVersions: [upgradeVersions[key].upgradeVersion],
            recommendedActionType: "UpgradePackage",
            description: null,
          };
        });
        const request = {
          projects,
          solutionPath,
          targetFramework,
          RecommendedActions,
        };
        logger.log(
          `REQUEST - applyPortingProjectFileChanges: ${JSON.stringify(request)}`
        );
        const response = await connection.send(
          "applyPortingProjectFileChanges",
          request
        );
        logger.log(
          `RESPONSE - applyPortingProjectFileChanges: ${JSON.stringify(
            response
          )}`
        );
        return response;
      }
    );

    ipcMain.handle("openSolutionInIDE", async (_event, solutionFilePath) => {
      const response = await connection.send(
        "openSolutionInIDE",
        solutionFilePath
      );
      return response;
    });

    ipcMain.handle("checkInternetAccess", async (_event) => {
      const response = await connection.send("checkInternetAccess", "");
      return response;
    });  

    connection.on("onNugetPackageUpdate", (response) => {
      browserWindow.webContents.send("onNugetPackageUpdate", response);
    });

    connection.on("onApiAnalysisUpdate", (response) => {
      browserWindow.webContents.send("onApiAnalysisUpdate", response);
    });

    return connection;
  };

  return {
    getConnectionInstance: () => instance,
    closeConnection: () => {
      if (instance != null) {
        instance.close();
      }
    },
    registerListeners: (browserWindow: Electron.BrowserWindow) => {
      if (!localStore.get("profile")) {
        console.log("Did not find profile, setting onDidChange");
        localStore.onDidChange("profile", () => {
          console.log("Profile changed, recreating connection");
          if (instance != null) {
            instance.close();
            instance = undefined;
          }
          instance = createConnection(browserWindow);
          registerLogListeners(instance);
        });
      } else {
        console.log("profileFound: " + localStore.get("profile"));
        instance = createConnection(browserWindow);
        registerLogListeners(instance);
      }
    },
  };
};
