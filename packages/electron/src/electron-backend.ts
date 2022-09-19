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
  logReactError,
  logReactMetrics,
  registerLogListeners,
} from "./telemetry/electron-telemetry";
import { localStore } from "./preload-localStore";
import { latestVersion, outdatedVersionFlag } from "./electron";

ipcMain.handle("verifyProfile", (_event, profile: string) => {
  return testProfile(profile);
});
ipcMain.handle("getConfigPath", (_event) => {
  return app.getPath("userData");
});
ipcMain.handle("getLatestVersion", (_event) => {
  return latestVersion;
});
ipcMain.handle("getOutdatedVersionFlag", (_event) => {
  return outdatedVersionFlag;
});

export const initTelemetryConnection = (logger: any = console) => {
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
                      "PortingAssistant.Telemetry.dll"
                  )
                  : path.join(
                      path.dirname(app.getPath("exe")),
                      "resources",
                      "netcore_build",
                      "PortingAssistant.Telemetry.dll"
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
              app.getVersion(),
              localStore.get("useDefaultCreds"),
              localStore.get("share")
          )
          .build();
    console.log("Telemetry Connection Start.");
    connection.onDisconnect = () => {
      // Recreate connection on disconnect
      logger.log("telemetry disconnected");
      instance = undefined;
    };

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
      if (localStore.get("profile")) {
        console.log("profileFound: " + localStore.get("profile"));
        instance = createConnection(browserWindow);
      }

      localStore.onDidChange("profile", () => {
        console.log("Profile changed, recreating telemetry connection");
        if (instance != null) {
          instance.close();
          instance = undefined;
        }
        instance = createConnection(browserWindow);
      });
    },
  };
};

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
  ipcMain.handle(
    "writeReactErrLog",
    async (_event, source, message, response) => {
      logReactError(source, message, response);
    }
  );
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
        app.getVersion(),
        localStore.get("useDefaultCreds")
      )
      .build();

    connection.onDisconnect = () => {
      // Recreate connection on disconnect
      logger.log("disconnected");
      instance = undefined;
    };

    ipcMain.handle(
      "analyzeSolution",
      async (_event, solutionFilePath, runId, triggerType, settings, preTriggerData) => {
        const request = { solutionFilePath, runId, triggerType, settings, preTriggerData };
        const elapseTime = startTimer();
        logger.log(`REQUEST - analyzeSolution: ${JSON.stringify(request)}`);
        localStore.set("isAssesmentRunning", true);
        const response = await connection.send("analyzeSolution", request);
        localStore.set("isAssesmentRunning", false);
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

    ipcMain.handle("cancelAssessment", async (_event) => {
      const response = await connection.send("cancelAssessment", "");
      return response;
    });
    
    ipcMain.handle("copyDirectory", async (_event, solutionPath, destinationPath) => {
      const request = {
        solutionPath,
        destinationPath,
      };
      const response = await connection.send("copyDirectory", request);
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
      instance = createConnection(browserWindow);
      registerLogListeners(instance);
    },
  };
};
