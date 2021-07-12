import { Dispatch } from "redux";

import { internetAccessFailed } from "../constants/messages";
import { analyzeSolution } from "../store/actions/backend";
import { setCurrentMessageUpdate } from "../store/actions/error";

export const checkInternetAccess = async (solutionPath: string, dispatch: Dispatch) => {
  const haveInternet: boolean = await window.backend.checkInternetAccess();
  if (!haveInternet) {
    dispatch(
      setCurrentMessageUpdate([internetAccessFailed()])
    );
    dispatch(
      analyzeSolution.failure({
        error: "Cannot analyze solution witout internet connectivity",
        solutionPath: solutionPath
      })
    );
  }
  return haveInternet;
};

export const checkInternetElectron = async (dispatch: Dispatch) => {
  const haveInternet: boolean = await window.electron.checkInternetAccess();
  if (!haveInternet) {
    dispatch(
      setCurrentMessageUpdate([
        {
          messageId: uuid(),
          groupId: "accessPrereqFailed",
          type: "error",
          header: "Unable to access S3",
          content: "Please check your internet connection",
          buttonText: "View prerequisites",
          onButtonClick: () => window.electron.openExternalUrl(externalUrls.prereq)
        }
      ])
    );
  }
  return haveInternet;
};
