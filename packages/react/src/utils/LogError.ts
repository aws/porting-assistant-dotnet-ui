import { RootState } from "../store/reducers";

export const logError = (errorFile: string, errorMessage: string, err: any) => {
  const data = {
    errorType: "DefaultError",
    errorFile,
    errorMessage,
    error: err
  };
  console.error(data);
};

export const logErrorAction = (errorAction: string, state: RootState, err: any) => {
  const data = {
    errorType: "ReduxActionFailure",
    errorAction,
    error: err,
    state
  };
  console.error(data);
};
