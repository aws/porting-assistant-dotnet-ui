import { profileSelection } from "../constants/appConstants"

export const getProfileName = (profileName: string|undefined) => {
  if (profileName === profileSelection.PROFILE_SELECTION.defaultProfileName || !profileName){
    return "Default Credentials"} 
  else {
    return profileName
  }
}