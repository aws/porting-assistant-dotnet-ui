export interface Profiles {
  [profileName: string]: Credentials;
}

export interface Credentials {
  aws_access_key_id: string;
  aws_secret_access_key: string;
}
