import { Application } from "spectron";
import os from "os";
import path from "path";
import electron from "electron";

const isWindows = os.platform() === "win32";

export const testSolutionPath = () => {
  if (isWindows) {
    return path.join("C:", "testsolutions");
  } else {
    return path.join(__dirname, "..", "testsolutions");
  }
};

export const awsCredPath = () => {
  return path.join(os.homedir(), ".aws", "credentials");
};

export const startApp = async () => {
  try {
    const app = await new Application({
      startTimeout: 1000 * 30,
      waitTimeout: 1000 * 10,
      chromeDriverLogPath: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "chrome-driver.log"
      ),
      webdriverLogPath: path.join(__dirname, "..", "..", ".."),
      path: isWindows
        ? path.join("C:", "TestApp", "Porting Assistant for .NET.exe")
        : (electron as any),
      args: isWindows
        ? undefined
        : [
            path.join(
              __dirname,
              "..",
              "node_modules",
              "@porting-assistant",
              "electron"
            ),
          ],
      env: { NODE_ENV: "test" },
    }).start();
    return app;
  } catch (ex) {
    fail(ex);
  }
};

export const stopApp = async (app: Application) => {
  if (app && app.isRunning()) {
    return app.stop();
  }
};

export const addSolution = async (app: Application, solutionPath: string) => {
  await app.client.execute(
    `window.test.addSolution(${JSON.stringify(String(solutionPath))});`
  );
};

export const clearSolutions = async (app: Application) => {
  await app.client.execute(`window.test.clearSolutions();`);
};

export const clearState = async (app: Application) => {
  await app.client.execute(`window.test.clearState();`);
};

export const goHome = async (app: Application) => {
  const breadcrumb = await app.client.$(
    ".awsui-breadcrumb-group ol li:nth-child(3) a"
  );
  if (await breadcrumb.isExisting()) {
    await breadcrumb.click();
  }
};

export const setupElectronLogs = (app: Application) => {
  if (process.env["SHOW_ELECTRON_LOGS"] === "true") {
    app.client.getMainProcessLogs().then((logs) => {
      logs.forEach((log) => {
        console.log(`ELECTRON - ${log}`);
      });
    });
    app.client.getRenderProcessLogs().then((logs) => {
      logs.forEach((log: any) => {
        console.log(
          `RENDERER - ${log.timestamp} [${log.level}]: ${log.message}`
        );
      });
    });
  }
};
