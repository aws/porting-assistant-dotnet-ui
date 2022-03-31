export const getProfileName = (profileName: string|undefined) => {
  if (profileName === "DEFAULT_SDK_CHAIN_PROVIDER_CREDENTIAL_PROFILE" || !profileName){
    return "Default Credentials"} 
  else {
    return profileName
  }
}