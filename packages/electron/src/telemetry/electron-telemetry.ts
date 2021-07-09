import { app } from "electron";
import {
  metricsBuffer,
  electronLogBuffer,
  backendLogBuffer,
  reactErrorBuffer,
} from "../models/buffer";
import {
  ProjectApiAnalysisResult,
  PackageAnalysisResult,
} from "@porting-assistant/react/src/models/project";
import { SolutionDetails } from "@porting-assistant/react/src/models/solution";
import crypto from "crypto";
import fs from "fs";
import log, { LogMessage, LevelOption, info } from "electron-log";
import { Connection } from "electron-cgi/connection";
import { putMetricData } from "./electron-metrics";
import { localStore } from "../preload-localStore";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";


const backendLogName = "portingAssistant-backend-%DATE%";
const electronLogName = "portingAssistant-electron-%DATE%";
const reactLogName = "portingAssistant-react-%DATE%";

const dirName = path.join(app.getPath("userData"), "logs");

if (!fs.existsSync(dirName))
  fs.mkdir(dirName, (err) => {
    console.log("Telemetry Directory Creation Failed.");
  });

var winstonTransportsBackend = [
  new DailyRotateFile({
    datePattern: "YYYY-MM-DD",
    extension: ".log",
    filename: backendLogName,
    dirname: dirName,
    maxFiles: 20,
    format: winston.format.combine(
      winston.format.printf((info) => {
        return `${info.message}`;
      })
    ),
  }),
];

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

var backendLogger = winston.createLogger({
  transports: winstonTransportsBackend,
  exitOnError: false,
});

var electronLogger = winston.createLogger({
  transports: winstonTransportsElectron,
  exitOnError: false,
});

var reactLogger = winston.createLogger({
  transports: winstonTransportsReact,
  exitOnError: false,
});

export const logReactMetrics = (response: any) => {
  const targetFramework =
    localStore.get("targetFramework").id || "netcoreapp3.1";
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

export const logSolutionMetrics = (response: any, time: number) => {
  try {
    if (response.status.status === "Failure") {
      errorHandler(response, "Solutions");
    } else if (response.status.status === "Success") {
      const solutionDetails: SolutionDetails = response.value;
      const targetFramework =
        localStore.get("targetFramework").id || "netcoreapp3.1";

      let allpackages = new Set(
        solutionDetails.projects
          .flatMap((project) => {
            return project.packageReferences;
          })
          .filter((p) => p !== undefined || p !== null)
      );
    }
  } catch (err) {}
};

export const logApiMetrics = (response: any) => {
  try {
    if (response.status.status !== "Success") {
      return;
    }
    const projectAnalysis: ProjectApiAnalysisResult = response.value;
    const targetFramework =
      localStore.get("targetFramework").id || "netcoreapp3.1";
    if (
      projectAnalysis.sourceFileAnalysisResults != null &&
      projectAnalysis.projectFile != null
    ) {
      //Metrics with ListMetrics and MetaData
      const apis = projectAnalysis.sourceFileAnalysisResults.flatMap(
        (sourceFileAnalysisResults) =>
          sourceFileAnalysisResults.apiAnalysisResults.map((invocation) => {
            return {
              name: invocation.codeEntityDetails.name,
              namespace: invocation.codeEntityDetails.namespace,
              originalDefinition: invocation.codeEntityDetails?.signature,
              compatibility:
                invocation.compatibilityResults[targetFramework]?.compatibility,
            };
          })
      );
    }
  } catch (err) {}
};


export const registerLogListeners = (connection: Connection) => {
  const targetFramework =
    localStore.get("targetFramework").id || "netcoreapp3.1";
  // Electron Logs
  const transport = (message: LogMessage) => {
    try {
      const str: string = message.data[0];
      if (str) {
        const logs = {
            portingAssistantVersion: app.getVersion(),
            targetFramework: targetFramework,
            content: str,
        };
        electronLogger.info(JSON.stringify(logs));
      }
    } catch (err) {}
  };
  transport.level = "warn" as LevelOption;
  log.transports["electron"] = transport;

  //Backend Logs
  connection.on("onDataUpdate", (response) => {
    try {
      const logs = {
          portingAssistantVersion: app.getVersion(),
          targetFramework: targetFramework,
          content: response,
      };
      console.log("Writing Log to Buffer");
      backendLogger.info(JSON.stringify(logs));
    } catch (err) {}
  });

  //Metrics
  connection.on("onApiAnalysisUpdate", (response) => {
    try {
      logApiMetrics(response);
    } catch (err) {}
  });

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
    localStore.get("targetFramework").id || "netcoreapp3.1";
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