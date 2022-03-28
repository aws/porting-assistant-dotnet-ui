import { Credentials, CredentialProvider } from "@aws-sdk/types";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import {
  loadSharedConfigFiles,
  SharedConfigFiles,
} from "@aws-sdk/shared-ini-file-loader";
import { fromIni } from "@aws-sdk/credential-providers";
import { localStore } from "../preload-localStore";

// Get shared credentials
export const getProfileCredentials = async (
  profileName?: string
): Promise<Credentials> => {
  return await getAwsCredentialsProvider(profileName)();
};

export const getAwsCredentialsProvider = (
  profile?: string
): CredentialProvider => {
  if (localStore.get("useDefaultCreds")) {
    console.log(`Fetching AWS credentials using default provider.`);
    return defaultProvider();
  } else {
    console.log(`Fetching AWS credentials using profile '${profile}'.`);
    return fromIni({ profile });
  }
};

export const getAwsProfiles = async (): Promise<SharedConfigFiles> => {
  try {
    console.log("Fetching AWS profiles.");
    return await loadSharedConfigFiles();
  } catch (err) {
    const causeMessage = err instanceof Error ? err.stack : err;
    throw new Error(`Failed to load shared config files.\n${causeMessage}`);
  }
};
