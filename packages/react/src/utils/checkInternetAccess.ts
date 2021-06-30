import { Dispatch } from "redux";
import { v4 as uuid } from "uuid";

import { externalUrls } from "../constants/externalUrls";
import { analyzeSolution } from "../store/actions/backend";
import { setCurrentMessageUpdate } from "../store/actions/error";

export const checkInternetAccess  = async (solutionPath: string, dispatch: Dispatch) => {
  const haveInternet:boolean = await window.backend.checkInternetAccess();
  if (!haveInternet) {
    dispatch(
      setCurrentMessageUpdate([{
        messageId: uuid(),
        groupId: "internetAccessFailed",
        type: "error",
        header: "No Internet Access",
        content: "Ensure you have internet access before using the application",
        buttonText: "View prerequisites",
        onButtonClick: () => window.electron.openExternalUrl(externalUrls.prereq)
      }])
    );
    dispatch(
      analyzeSolution.failure({
        error: "Cannot analyze solution witout internet connectivity",
        solutionPath: solutionPath
      })
    );
  }
  return haveInternet;
}
