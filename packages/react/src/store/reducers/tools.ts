import { produce } from "immer";
import { createReducer } from "typesafe-actions";

import { HelpInfo } from "../../models/tools";
import { openTools, setInfo } from "../actions/tools";

export const toolsReducer = createReducer({
  isOpen: false,
  info: { heading: "", mainContent: "", learnMoreLinks: [] } as HelpInfo
})
  .handleAction(openTools, (state, action) =>
    produce(state, draftState => {
      draftState.isOpen = action.payload.isOpen;
      if (action.payload.info != null) {
        draftState.info = action.payload.info;
      }
    })
  )
  .handleAction(setInfo, (state, action) =>
    produce(state, draftState => {
      if (action.payload != null) {
        draftState.info = action.payload;
      }
    })
  );
