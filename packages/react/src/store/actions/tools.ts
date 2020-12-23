import { createAction } from "typesafe-actions";

import { HelpInfo } from "../../models/tools";

export interface OpenToolsPayload {
  isOpen: boolean;
  info?: HelpInfo;
}
export const openTools = createAction("openTools")<OpenToolsPayload>();

export const setInfo = createAction("setInfo")<HelpInfo>();
