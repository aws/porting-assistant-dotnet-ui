import { Dispatch } from "redux";
import { v4 as uuid } from "uuid";

import { externalUrls } from "../constants/externalUrls";
import { analyzeSolution } from "../store/actions/backend";
import { setCurrentMessageUpdate } from "../store/actions/error";

export const checkInternetAccess = async (solutionPath: string, dispatch: Dispatch) => {
  const haveInternet: boolean = await window.backend.checkInternetAccess();
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
