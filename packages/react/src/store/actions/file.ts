import { createAsyncAction } from "typesafe-actions";

export interface getFileContentsSuccessPayload {
  sourceFilePath: string;
  fileContents: string;
}
export interface getFileContentsFailurePayload {
  sourceFilePath: string;
  error: Error;
}
export const getFileContents = createAsyncAction(
  "getFileContents_Request",
  "getFileContents_Success",
  "getFileContents_Failure"
)<string, getFileContentsSuccessPayload, getFileContentsFailurePayload>();
