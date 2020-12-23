import { produce } from "immer";
import { createReducer } from "typesafe-actions";

import { SourceFileToContents } from "../../models/project";
import { Failed, isLoaded, Loaded, Loading, Reloading } from "../../utils/Loadable";
import { getFileContents } from "../actions/file";

export const fileReducer = createReducer({
  sourceFileToContents: {} as SourceFileToContents
})
  .handleAction(getFileContents.request, (state, action) =>
    produce(state, draftState => {
      const contents = state.sourceFileToContents[action.payload];
      if (contents === undefined) {
        draftState.sourceFileToContents[action.payload] = Loading();
        return;
      }
      if (isLoaded(contents)) {
        draftState.sourceFileToContents[action.payload] = Reloading(contents.data);
      } else {
        draftState.sourceFileToContents[action.payload] = Loading();
      }
    })
  )
  .handleAction(getFileContents.success, (state, action) =>
    produce(state, draftState => {
      draftState.sourceFileToContents[action.payload.sourceFilePath] = Loaded(action.payload.fileContents);
    })
  )
  .handleAction(getFileContents.failure, (state, action) =>
    produce(state, draftState => {
      draftState.sourceFileToContents[action.payload.sourceFilePath] = Failed(action.payload.error);
    })
  );
