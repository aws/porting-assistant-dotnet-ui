import AWS from "aws-sdk";

// Get shared credentials
export const getProfileCredentials = (profileName: string) => {
  try {
    const credentials = new AWS.SharedIniFileCredentials({
      profile: profileName,
    });
    AWS.config.credentials = credentials;
    return credentials;
  } catch (error) {
    console.error(error);
  }
};
