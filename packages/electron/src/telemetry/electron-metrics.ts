import path from "path";
import { app } from "electron";
import electronIsDev from "electron-is-dev";
import { getProfileCredentials } from "./electron-get-profile-credentials";
import { PutLogDataRequest } from "../models/putLogDataRequest";
import { PutMetricDataRequest } from "../models/putMetricDataRequest";
import { localStore } from "../preload-localStore";
import { Credentials } from "@aws-sdk/types";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { HttpRequest, HttpResponse } from "@aws-sdk/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-browser";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";

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

const sendRequest = async (
  pathParams: { [key: string]: string },
  pathTemplate: string,
  method: string,
  additionalParams: { [key: string]: string },
  body: PutLogDataRequest | PutMetricDataRequest,
  newProfile?: string | undefined
): Promise<boolean> => {
  const metricsEnabled = localStore.get("share");
  const profileName = newProfile || localStore.get("profile");
  const credentials: Credentials | undefined = await getProfileCredentials(profileName);
  const awsAccessKeyId: string | undefined = credentials?.accessKeyId;
  const awsSecretAccessKey: string | undefined = credentials?.secretAccessKey;
  const awsSessionToken: string | undefined = credentials?.sessionToken;

  if (!metricsEnabled && !newProfile) {
    return true;
  }

  if (awsAccessKeyId === undefined || awsSecretAccessKey === undefined) {
    console.error(`Credentials are undefined for profile: ${profileName}`);
    return false;
  }

  try {
    var signedRequest = await createAndSignRequest(
      body,
      pathTemplate,
      method,
      credentials
    );
    var client = new NodeHttpHandler();
    var { response } = await client.handle(signedRequest as HttpRequest);
    logResponse(response);
    return response.statusCode < 300;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const logResponse = async (response: HttpResponse) => {
  var responseBody = "";
  console.log(response.statusCode + " " + response.body.statusMessage);
  try {
    response.body.on("data", (chunk: string) => {
      responseBody += chunk;
    });
    response.body.on("end", () => {
      console.log("Response body: " + responseBody);
    });
  } catch (e) {
    console.log(e);
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
  return await sendRequest(
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
  return await sendRequest(
    pathParams,
    pathTemplate,
    method,
    additionalParams,
    body
  );
};

export const testProfile = async (profile: string) => {
  try {
    const body = {
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
    };
    return await sendRequest({}, "/put-log-data", "POST", {}, body, profile);
  } catch (ex) {
    console.error(ex);
    return false;
  }
};
async function createAndSignRequest(
  body: PutLogDataRequest | PutMetricDataRequest,
  pathTemplate: string,
  method: string,
  credentials: Credentials
) {
  var invokeUrl = new URL(config.PortingAssistantMetrics.InvokeUrl);
  if (invokeUrl.pathname !== "/") {
    pathTemplate = invokeUrl.pathname + pathTemplate;
  }
  var request = new HttpRequest({
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      host: invokeUrl.host,
    },
    hostname: invokeUrl.hostname,
    method: method,
    path: pathTemplate,
  });

  // Sign the request
  var signer = new SignatureV4({
    credentials: credentials,
    region: config.PortingAssistantMetrics.Region,
    service: "execute-api",
    sha256: Sha256,
  });
  var signedRequest = await signer.sign(request);
  return signedRequest;
}
