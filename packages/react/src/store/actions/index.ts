import { ActionType } from "typesafe-actions";

import * as solutionActions from "./backend";
import * as errorActions from "./error";
import * as fileActions from "./file";
import * as nugetPackageActions from "./nugetPackage";
import * as portingActions from "./porting";
import * as toolsActions from "./tools";

export const actions = {
  solution: solutionActions,
  porting: portingActions,
  nugetPackage: nugetPackageActions,
  file: fileActions,
  error: errorActions,
  tools: toolsActions
};

export type RootAction = ActionType<typeof actions>;
