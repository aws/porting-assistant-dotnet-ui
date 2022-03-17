import os from "os";
import path from "path";
import fs, { promises as fsPromises } from "fs";
import { getAwsProfiles } from "./telemetry/electron-get-profile-credentials";

interface Credentials {
  aws_access_key_id: string;
  aws_secret_access_key: string;
  aws_session_token: string;
}

const sharedConfigFileNames = {
  credentials: "credentials",
  config: "config",
};

export async function writeProfile(
  profileName: string,
  credentials: Credentials
) {
  if (!fs.existsSync(path.join(getHomeDir(), ".aws"))) {
    await fsPromises.mkdir(path.join(getHomeDir(), ".aws"));
  }
  if (!fs.existsSync(getDefaultFilePath())) {
    await fsPromises.writeFile(getDefaultFilePath(), "");
  }
  const { aws_access_key_id, aws_secret_access_key, aws_session_token } =
    credentials;
  var profile = `${os.EOL}[${profileName}]${os.EOL}aws_access_key_id = ${aws_access_key_id}${os.EOL}aws_secret_access_key = ${aws_secret_access_key}${os.EOL}`;
  if (aws_session_token) {
    profile = profile.concat(
      `aws_session_token = ${aws_session_token}${os.EOL}`
    );
  }
  await fsPromises.appendFile(getDefaultFilePath(), profile);
}

async function getFilePath(profileName: string) {
  const sharedConfigFiles = await getAwsProfiles();
  if (sharedConfigFiles.credentialsFile[profileName] !== undefined) {
    return sharedConfigFileNames.credentials;
  } else if (sharedConfigFiles.configFile[profileName] !== undefined) {
    return sharedConfigFileNames.config;
  } else {
    return sharedConfigFileNames.credentials;
  }
}

function getDefaultFilePath() {
  return path.join(getHomeDir(), ".aws", "credentials");
}

function getHomeDir() {
  var env = process.env;
  var home =
    env.HOME ||
    env.USERPROFILE ||
    (env.HOMEPATH ? (env.HOMEDRIVE || "C:/") + env.HOMEPATH : null);

  if (home) {
    return home;
  }

  if (typeof os.homedir === "function") {
    return os.homedir();
  }
  throw new Error("Cannot load credentials, HOME path not set");
}
