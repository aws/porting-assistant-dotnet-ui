import path from "path";
import { app } from "electron";
import electronIsDev from "electron-is-dev";
import apigClientFactory from "aws-api-gateway-client";
import { getProfileCredentials } from "./electron-get-profile-credentials";
import { PutLogDataRequest } from "../models/putLogDataRequest";
import { PutMetricDataRequest } from "../models/putMetricDataRequest";
import { localStore } from "../preload-localStore";

// Configuraion
export const config = require(electronIsDev
  ? path.join(
      __dirname,
      "../..",
      "build-scripts",
      "porting-assistant-config.dev.json"
    )
  : path.join(
      path.dirname(app.getPath("exe")),
      "resources",
      "config",
      "porting-assistant-config.json"
    ));

// Create client
const createClient = (
  profileName: string,
  region: string,
  invokeUrl: string
) => {
  let credentials:
    | AWS.SharedIniFileCredentials
    | undefined = getProfileCredentials(profileName);
  const awsAccessKeyId: string | undefined = credentials?.accessKeyId;
  const awsSecretAccessKey: string | undefined = credentials?.secretAccessKey;
  if (awsAccessKeyId === undefined || awsSecretAccessKey === undefined) {
    console.error(`Credentials are undefined for profile: ${profileName}`);
    return null;
  }
  const apigClient = apigClientFactory.newClient({
    invokeUrl: invokeUrl,
    region: region,
    accessKey: awsAccessKeyId,
    secretKey: awsSecretAccessKey,
  });
  return apigClient;
};

const createRequest = async (
  pathParams: { [key: string]: string },
  pathTemplate: string,
  method: string,
  additionalParams: { [key: string]: string },
  body: PutLogDataRequest | PutMetricDataRequest
): Promise<boolean> => {
  var apigClient = createClient(
    localStore.get("profile"),
    config.PortingAssistantMetrics.Region,
    config.PortingAssistantMetrics.InvokeUrl
  );
  var metricsEnabled = localStore.get("share");
  if (metricsEnabled && apigClient != null) {
    try {
      await apigClient.invokeApi(
        pathParams,
        pathTemplate,
        method,
        additionalParams,
        body
      );
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  } else {
    return true;
  }
};

// Create putLogData request
export const putLogData = async (logName: string, logData: string) => {
  const pathParams = {};
  const pathTemplate = "/put-log-data";
  const method = "POST";
  const additionalParams = {};
  const body = {
    requestMetadata: {
      version: "1.0",
      service: config.PortingAssistantMetrics.ServiceName,
      token: "12345678", // Hard-coded as client side  authentication not implemented yet
      description: "Porting Assistant for .NET Log",
    },
    log: {
      timeStamp: new Date().toLocaleString(),
      logName: logName,
      logData: logData,
    },
  };
  return await createRequest(
    pathParams,
    pathTemplate,
    method,
    additionalParams,
    body
  );
};

// Create putMetricData request
export const putMetricData = async (
  namespace: string,
  metricName: string,
  unit: string,
  value: number,
  dimensions: { Value?: string; Name?: string; [key: string]: unknown }[]
) => {
  const pathParams = {};
  const pathTemplate = "/put-metric-data";
  const method = "POST";
  const additionalParams = {};
  const body: PutMetricDataRequest = {
    requestMetadata: {
      version: "1.0",
      service: config.PortingAssistantMetrics.ServiceName,
      token: "12345678",
      description: "Porting Assistant for .NET Log",
      created: new Date().toDateString(),
      namespace: namespace,
    },
    metrics: [
      {
        metricName: metricName,
        unit: unit,
        value: value,
        timeStamp: new Date().toISOString(),
        dimensions: dimensions,
      },
    ],
  };
  return await createRequest(
    pathParams,
    pathTemplate,
    method,
    additionalParams,
    body
  );
};

export const testProfile = async (profile: string) => {
  var apigClient = createClient(
    profile,
    config.PortingAssistantMetrics.Region,
    config.PortingAssistantMetrics.InvokeUrl
  );
  if (apigClient == null) {
    return false;
  }
  try {
    const response = await apigClient.invokeApi(
      {},
      "/put-log-data",
      "POST",
      {},
      {
        requestMetadata: {
          version: "1.0",
          service: config.PortingAssistantMetrics.ServiceName,
          token: "12345678", // Hard-coded as client side  authentication not implemented yet
          description: "PortingAssistant Log",
        },
        log: {
          timeStamp: new Date().toLocaleString(),
          logName: "verify-user",
          logData: "",
        },
      }
    );
    if (response.status === 200) {
      return true;
    }
    return false;
  } catch (ex) {
    console.error(ex);
    return false;
  }
};

// // Example Call
// putLogData("test-log", "test");
// putMetricData("portingAssistant-backend", "test-metric", "Count", 1, [
//   { Value: "test", Name: "Test" },
// ]);
