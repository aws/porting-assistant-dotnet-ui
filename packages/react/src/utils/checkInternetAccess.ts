import { Dispatch } from "redux";

import { internetAccessFailed } from "../constants/messages";
import { analyzeSolution } from "../store/actions/backend";
import { setCurrentMessageUpdate } from "../store/actions/error";

export const checkInternetAccess = async (solutionPath: string, dispatch: Dispatch) => {
  const haveInternet: boolean = await window.electron.checkInternetAccess();
  if (!haveInternet) {
    dispatch(
      setCurrentMessageUpdate([internetAccessFailed()])
    );
    if (solutionPath !== "") {
      dispatch(
        analyzeSolution.failure({
          error: "Cannot analyze solution witout internet connectivity",
          solutionPath: solutionPath
        })
      );
    }
  }
  return haveInternet;
};
