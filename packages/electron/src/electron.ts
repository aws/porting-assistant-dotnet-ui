import process from "process";
import os from "os";
import {
  Menu,
  app,
  BrowserWindow,
  dialog,
  screen,
  MenuItemConstructorOptions,
  MenuItem,
  shell,
} from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";
import log from "electron-log";
import url from "url";
import electronIsDev from "electron-is-dev";
import { initConnection } from "./electron-backend";
import { localStore } from "./preload-localStore";

const upgradeConfig = require(electronIsDev
  ? path.join("..", "build-scripts", "upgrade-config-dev.json")
  : path.join(
      path.dirname(app.getPath("exe")),
      "resources",
      "upgrade",
      "upgrade-config.json"
    ));
const LocalProvider = require("./LocalProvider").LocalProvider;

let mainWindow: Electron.BrowserWindow | undefined;

const template: Array<MenuItemConstructorOptions | MenuItem> = [
  ...(os.platform() !== "win32"
    ? ([{ role: "appMenu" }] as MenuItem[])
    : Array<MenuItem>()),
  { role: "fileMenu" },
  { role: "editMenu" },
  {
    role: "help",
    submenu: [
      {
        label: "View license",
        click: async () => {
          await shell.openExternal(
            "https://raw.githubusercontent.com/aws/porting-assistant-dotnet-ui/develop/LICENSE"
          );
        },
      },
      {
        label: "View 3rd party licenses",
        click: async () => {
          await shell.openExternal(
            "https://raw.githubusercontent.com/aws/porting-assistant-dotnet-ui/develop/LICENSE-THIRD-PARTY"
          );
        },
      },
      { type: "separator" },
      {
        label: "Report an issue",
        click: async () => {
          await shell.openExternal(
            "mailto:aws-porting-assistant-support@amazon.com"
          );
        },
      },
      {
        label: "Porting Assistant for .NET help",
        click: async () => {
          await shell.openExternal(
            "https://docs.aws.amazon.com/portingassistant/latest/userguide/what-is-porting-assistant.html"
          );
        },
      },
    ],
  },
];

if (
  electronIsDev ||
  process.env["NODE_ENV"] === "test" ||
  process.env["NODE_ENV"] === "debug"
) {
  template.splice(template.length - 1, 0, { role: "viewMenu" });
}

Menu.setApplicationMenu(Menu.buildFromTemplate(template));

log.transports.file.level = "info";
log.transports.console.level = false;

console.log(`Log files at: ${log.transports.file.getFile().path}`);
console.log(`Config files at: ${path.dirname(localStore.path)}`);

Object.assign(console, log.functions);

autoUpdater.logger = log;

autoUpdater.autoDownload = true;
autoUpdater.allowDowngrade = true;
autoUpdater.autoInstallOnAppQuit = false;

const connection = initConnection(log.functions);

const isDev =
  electronIsDev &&
  process.env["NODE_ENV"] !== "production" &&
  process.env["NODE_ENV"] !== "test";
const isTest = process.env["NODE_ENV"] === "test";

function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, "..", "build", "icon.ico"),
  });

  mainWindow.maximize();
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "../react_build/index.html"),
        protocol: "file",
        slashes: true,
      })
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });

  connection.registerListeners(mainWindow);

  // Create updater yml
  // @ts-ignore
  autoUpdater.clientPromise = new Promise((resolve) => {
    resolve(
      new LocalProvider(
        upgradeConfig.s3Url,
        // @ts-ignore
        autoUpdater.createProviderRuntimeOptions()
      )
    );
  });

  autoUpdater.on("error", (err) => {
    log.error(err);
  });

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox(mainWindow!, {
        type: "info",
        buttons: ["Restart", "Later"],
        title: "Application Update",
        message:
          "A new version has been downloaded. Restart the application to apply the updates. You may need to re-assess your solutions after the upgrade.",
      })
      .then((resp) => {
        if (resp.response === 0) {
          connection.closeConnection();
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.checkForUpdates();
}

app.allowRendererProcessReuse = true;

app.on("ready", () => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || isTest) {
    connection.closeConnection();
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

process.on("uncaughtException", (error) => {
  log.error("Uncaught exception caught: ", error);
});
