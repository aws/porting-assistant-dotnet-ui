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
import log, { LogMessage, LevelOption } from "electron-log";
import { Connection } from "electron-cgi/connection";
import { putMetricData } from "./electron-metrics";
import { localStore } from "../preload-localStore";

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
  reactErrorBuffer.push(JSON.stringify(errorMetric));
  putMetricData("portingAssistant-react-errors", "Error", "Count", 1, [
    {
      Name: "metricsType",
      Value: "reactError",
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

export const logSolutionMetrics = (response: any, time: number) => {
  try {
    if (response.status.status === "Failure") {
      errorHandler(response, "Solutions");
    } else if (response.status.status === "Success") {
      const solutionDetails: SolutionDetails = response.value;
      const targetFramework =
        localStore.get("targetFramework").id || "netcoreapp3.1";

      putMetricData(
        "portingAssistant-metrics", // Namespace
        "numSolutions", // Metric Name
        "Count", // Unit
        1, // Value
        [
          { Name: "metricsType", Value: "Solutions" },
          { Name: "portingAssistantVersion", Value: app.getVersion() },
          {
            Name: "targetFramework",
            Value: targetFramework,
          },
        ]
      ).catch((error) => {
        return;
      });

      putMetricData(
        "portingAssistant-metrics", // Namespace
        "numProject", // Metric Name
        "Count", // Unit
        solutionDetails.projects.length, // Value
        [
          { Name: "metricsType", Value: "Projects" },
          { Name: "portingAssistantVersion", Value: app.getVersion() },
          {
            Name: "targetFramework",
            Value: targetFramework,
          },
        ]
      ).catch((error) => {
        return;
      });

      let allpackages = new Set(
        solutionDetails.projects
          .flatMap((project) => {
            return project.packageReferences;
          })
          .filter((p) => p !== undefined || p !== null)
      );

      putMetricData(
        "portingAssistant-metrics", // Namespace
        "numNugets", // Metric Name
        "Count", // Unit
        allpackages.size || 0, // Value
        [
          { Name: "metricsType", Value: "NugetPackages" },
          { Name: "portingAssistantVersion", Value: app.getVersion() },
          {
            Name: "targetFramework",
            Value: targetFramework,
          },
        ]
      ).catch((error) => {
        return;
      });

      const SolutionMetrics = {
        Metrics: { Status: "success" },
        TimeStamp: new Date(),
        ListMetrics: {},
        Dimensions: [
          { Name: "metricsType", Value: "Solutions" },
          {
            Name: "SolutionPath",
            Value: crypto
              .createHash("sha256")
              .update(solutionDetails.solutionFilePath || "")
              .digest("hex"),
          },
          { Name: "portingAssistantVersion", Value: app.getVersion() },
          {
            Name: "targetFramework",
            Value: targetFramework,
          },
        ],
      };

      metricsBuffer.push(JSON.stringify(SolutionMetrics));
      solutionDetails.projects.forEach((project) => {
        const projectMetrics = {
          Metrics: {
            numNugets: {
              Value: project.packageReferences?.length || 0,
              Unit: "Count",
            },
            numReferences: {
              Value: project.projectReferences?.length || 0,
              Unit: "Count",
            },
          },
          TimeStamp: new Date(),
          ListMetrics: {},
          Dimensions: [
            { Name: "metricsType", Value: "Project" },
            { Name: "portingAssistantVersion", Value: app.getVersion() },
            {
              Name: "targetFramework",
              Value: targetFramework,
            },
            {
              Name: "projectGuid",
              Value: project.projectGuid,
            },
            {
              Name: "isBuildFailed",
              Value: project.isBuildFailed,
            },
            {
              Name: "projectType",
              Value: project.projectType,
            },
            {
              Name: "targetFrameworks",
              Value: project.targetFrameworks,
            },
          ],
        };
        metricsBuffer.push(JSON.stringify(projectMetrics));
      });
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
    if (projectAnalysis.sourceFileAnalysisResults != null) {
      // Metric
      putMetricData(
        "portingAssistant-metrics", // Namespace
        "numApis", // Metric Name
        "Count", // Unit
        Object.values(projectAnalysis.sourceFileAnalysisResults).reduce(
          (agg, cur) => agg + cur.apiAnalysisResults.length,
          0
        ), // Value
        [
          { Name: "metricsType", Value: "apis" },
          { Name: "portingAssistantVersion", Value: app.getVersion() },
          {
            Name: "targetFramework",
            Value: targetFramework,
          },
        ]
      ).catch((error) => {
        return;
      });
    }

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
      const metrics = {
        Metrics: {},
        TimeStamp: new Date(),
        ListMetrics: [...apis],
        Dimensions: [
          { Name: "metricsType", Value: "apis" },
          {
            Name: "projectName",
            Value: crypto
              .createHash("sha256")
              .update(projectAnalysis.projectFile)
              .digest("hex"),
          },
          { Name: "portingAssistantVersion", Value: app.getVersion() },
          {
            Name: "targetFramework",
            Value: targetFramework,
          },
          {
            Name: "solutionPath",
            Value: crypto
              .createHash("sha256")
              .update(projectAnalysis.solutionFile)
              .digest("hex"),
          },
        ],
      };
      metricsBuffer.push(JSON.stringify(metrics));
    }
  } catch (err) {}
};

export const logNugetMetrics = (response: any) => {
  try {
    if (response.status.status !== "Success") {
      return;
    }
    const packageAnalysisResult: PackageAnalysisResult = response.value;
    const targetFramework =
      localStore.get("targetFramework").id || "netcoreapp3.1";
    if (
      packageAnalysisResult.packageVersionPair != null &&
      packageAnalysisResult.compatibilityResults != null
    ) {
      //Metrics with ListMetrics and MetaData
      const metrics = {
        Metrics: {},
        TimeStamp: new Date(),
        ListMetrics: [
          {
            packageName: packageAnalysisResult.packageVersionPair.packageId,
            packageVersion: packageAnalysisResult.packageVersionPair.version,
            compatibility:
              packageAnalysisResult.compatibilityResults[targetFramework]
                ?.compatibility,
          },
        ],
        Dimensions: [
          { Name: "metricsType", Value: "nuget" },
          { Name: "portingAssistantVersion", Value: app.getVersion() },
          {
            Name: "targetFramework",
            Value: targetFramework,
          },
        ],
      };
      metricsBuffer.push(JSON.stringify(metrics));
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
        electronLogBuffer.push(JSON.stringify(logs));
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
      backendLogBuffer.push(JSON.stringify(logs));
    } catch (err) {}
  });

  //Metrics
  connection.on("onApiAnalysisUpdate", (response) => {
    try {
      logApiMetrics(response);
    } catch (err) {}
  });

  connection.on("onNugetPackageUpdate", (response) => {
    try {
      logNugetMetrics(response);
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
  const errorMetric = {
    Metrics: {
      Status: "failed",
      ExceptionType: error.ClassName,
      ExceptionSource: error.Source,
    },
    TimeStamp: new Date(),
    ListMetrics: [
      {
        ErrorValue: errorValue,
        Error: error,
      },
    ],
    Dimensions: [
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
    ],
  };
  metricsBuffer.push(JSON.stringify(errorMetric));
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
