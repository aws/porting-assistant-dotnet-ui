import { v4 as uuid } from "uuid";

import { Message } from "../models/error";
import { externalUrls } from "./externalUrls";

export const internetAccessFailed = () => {
  const errorMessage: Message = {
    messageId: uuid(),
    groupId: "accessPrereqFailed",
    type: "error",
    header: "Unable to access the S3 datastore",
    content: "Please check your internet connection",
    buttonText: "View prerequisites",
    onButtonClick: () => window.electron.openExternalUrl(externalUrls.prereq)
  };
  return errorMessage;
}