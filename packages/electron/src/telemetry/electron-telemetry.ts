import { app } from "electron";
import {
  ProjectApiAnalysisResult,
} from "@porting-assistant/react/src/models/project";
import { SolutionDetails } from "@porting-assistant/react/src/models/solution";
import fs from "fs";
import log, { LogMessage, LevelOption } from "electron-log";
import { Connection } from "electron-cgi/connection";
import { putMetricData } from "./electron-metrics";
import { localStore } from "../preload-localStore";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";


const electronLogName = "portingAssistant-electron-%DATE%";
const reactLogName = "portingAssistant-react-%DATE%";

const dirName = path.join(app.getPath("userData"), "logs");

if (!fs.existsSync(dirName))
  fs.mkdir(dirName, (err) => {
    console.log("Telemetry Directory Creation Failed.");
  });

var winstonTransportsElectron = [
  new DailyRotateFile({
    datePattern: "YYYY-MM-DD",
    extension: ".log",
    filename: electronLogName,
    dirname: dirName,
    maxFiles: 20,
    format: winston.format.combine(
      winston.format.printf((info) => {
        return `${info.message}`;
      })
    ),
  }),
];

var winstonTransportsReact = [
  new DailyRotateFile({
    datePattern: "YYYY-MM-DD",
    extension: ".log",
    filename: reactLogName,
    dirname: dirName,
    maxFiles: 20,
    format: winston.format.combine(
      winston.format.printf((info) => {
        return `${info.message}`;
      })
    ),
  }),
];

export const electronLogger = winston.createLogger({
  transports: winstonTransportsElectron,
  exitOnError: false,
});

var reactLogger = winston.createLogger({
  transports: winstonTransportsReact,
  exitOnError: false,
});

export const logReactMetrics = (response: any) => {
  const targetFramework =
    localStore.get("targetFramework").id || "net6.0";
  // Error with MetaData
  const errorMetric = {
      Metrics: {
        Status: "failed",
      },
      TimeStamp: new Date(),
      ListMetrics: [
        {
          Error: response,
        },
      ],
      Dimensions: [
        {
          Name: "metricsType",
          Value: "portingAssistant-react-errors",
        },
        {
          Name: "portingAssistantVersion",
          Value: app.getVersion(),
        },
        {
          Name: "targetFramework",
          Value: targetFramework,
        },
      ],
  };
  reactLogger.info(JSON.stringify(errorMetric));
};

export const logReactEvents = (eventType: string, content: any) => {
  const cur = new Date();
  // let curTimeArr = cur.toISOString().split('T');
  // let curDate = curTimeArr[0];
  // let curTime = curTimeArr[1].split('.')[0];
  // let appVersion = app.getVersion();
  // let errorMessage = `[${curDate} ${curTime} ERR] (${appVersion}) ${source}: ${message}\n${response}`
  let eventMessage = {
    Timestamp: cur,
    ToolVersion: app.getVersion(),
    ToolType: "Porting Assistant For .NET",
    SessionId: "test",
    EventType: eventType,
  }
  Object.assign(eventMessage, content);
  reactLogger.info(JSON.stringify(eventMessage));
};

export const registerLogListeners = (connection: Connection) => {
  const targetFramework =
    localStore.get("targetFramework").id || "net6.0";
  // Electron Logs
  const transport = (message: LogMessage) => {
    try {
      const str: string = message.data[0];
      if (str) {
        const logs = {
            portingAssistantVersion: app.getVersion(),
            targetFramework: targetFramework,
            timeStamp:new Date(),
            content: str,
        };
        electronLogger.info(JSON.stringify(logs));
      }
    } catch (err) {}
  };
  transport.level = "warn" as LevelOption;
  log.transports["electron"] = transport;
};

export const startTimer = () => {
  const time = new Date().getTime();
  return () => {
    const endTime = new Date();
    const elapseTime = endTime.getTime() - time;
    return elapseTime;
  };
};

export const errorHandler = (response: any, metricsType: string) => {
  // Error with MetaData
  const errorValue = response.errorValue;
  const error = response.status.error;
  const targetFramework =
    localStore.get("targetFramework").id || "net6.0";
  // Error Metric
  putMetricData("portingAssistant-backend-errors", "Error", "Count", 1, [
    {
      Name: "metricsType",
      Value: metricsType,
    },
    {
      Name: "portingAssistantVersion",
      Value: app.getVersion(),
    },
    {
      Name: "targetFramework",
      Value: targetFramework,
    },
  ]).catch((error) => {
    return;
  });
};