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

const profileCredentials = {
  ACCESS_KEY_ID: "aws_access_key_id",
  SECRET_ACCESS_KEY: "aws_secret_access_key",
  SESSION_TOKEN: "aws_session_token"
}

async function getProfileData(
  fileName: string,
  profileName: string,
  credentials: Credentials
) {
  const { aws_access_key_id, aws_secret_access_key, aws_session_token } = credentials;
  const profileHeader = fileName === sharedConfigFileNames.config && profileName !== "default" ? `[profile ${profileName}]` : `[${profileName}]`;
  const profile = `${os.EOL}${profileHeader}${os.EOL}${profileCredentials.ACCESS_KEY_ID} = ${aws_access_key_id}${os.EOL}${profileCredentials.SECRET_ACCESS_KEY} = ${aws_secret_access_key}${os.EOL}`
    + (aws_session_token ? `${profileCredentials.SESSION_TOKEN} = ${aws_session_token}${os.EOL}${os.EOL}` : os.EOL);
  let profiles = (await fsPromises.readFile(getConfigFilePath(fileName), "utf8")).trim() + `${os.EOL}${os.EOL}`;
  const startIndex = profiles.indexOf(profileHeader);
  const profileExists = startIndex !== -1;
  if (profileExists) { // update existing profile
    const endIndex = profiles.indexOf("[", startIndex + 1);
    if (endIndex !== -1) {
      profiles = profiles.substring(0, startIndex) + profile + profiles.substring(endIndex);
    } else {
      profiles = profiles.substring(0, startIndex) + profile;
    }
    await fsPromises.writeFile(getConfigFilePath(fileName), profiles);
  }
  const profileData = {profile, profiles, profileExists};
  return profileData;
}

export async function writeProfile(
  profileName: string,
  credentials: Credentials
) {
  if (!fs.existsSync(path.join(getHomeDir(), ".aws"))) {
    await fsPromises.mkdir(path.join(getHomeDir(), ".aws"));
  }
  if (!fs.existsSync(getConfigFilePath(sharedConfigFileNames.credentials))) {
    await fsPromises.writeFile(getConfigFilePath(sharedConfigFileNames.credentials), "");
  }
  const credentialsFileProfileData = await getProfileData(sharedConfigFileNames.credentials, profileName, credentials);
  console.log("Credentials in Write Profile: ", credentialsFileProfileData);
  let profileExists = credentialsFileProfileData.profileExists;
  if (!profileExists && fs.existsSync(getConfigFilePath(sharedConfigFileNames.config))) {
    const configFileProfileData = await getProfileData(sharedConfigFileNames.config, profileName, credentials);
    profileExists = configFileProfileData.profileExists;
  }
  if (!profileExists) {
    // Add new profile in credentials file
    credentialsFileProfileData.profiles += credentialsFileProfileData.profile;
    await fsPromises.appendFile(getConfigFilePath(sharedConfigFileNames.credentials), credentialsFileProfileData.profiles);
  }
  // const { aws_access_key_id, aws_secret_access_key, aws_session_token } =
  //   credentials;
  // var profile = `${os.EOL}[${profileName}]${os.EOL}aws_access_key_id = ${aws_access_key_id}${os.EOL}aws_secret_access_key = ${aws_secret_access_key}${os.EOL}`;
  // if (aws_session_token) {
  //   profile = profile.concat(
  //     `aws_session_token = ${aws_session_token}${os.EOL}`
  //   );
  // }
  // await fsPromises.appendFile(getDefaultFilePath(), profile);
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

function getConfigFilePath(fileName: string) {  
  return path.join(getHomeDir(), ".aws", fileName);
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
