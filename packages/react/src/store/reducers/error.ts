import { produce } from "immer";
import { createReducer } from "typesafe-actions";

import { Message } from "../../models/error";
import {
  pushCurrentMessageUpdate,
  pushPendingMessageUpdate,
  removeCurrentMessageUpdate,
  resetMessageUpdate,
  setCurrentMessageUpdate
} from "../actions/error";

export const errorReducer = createReducer({
  pendingMessages: Array<Message>(),
  currentMessages: Array<Message>()
})
  .handleAction(pushPendingMessageUpdate, (state, action) =>
    produce(state, draftState => {
      if (action.payload.groupId != null) {
        draftState.pendingMessages = draftState.pendingMessages.filter(m => m.groupId !== action.payload.groupId);
      }
      draftState.pendingMessages.push(action.payload);
    })
  )
  .handleAction(pushCurrentMessageUpdate, (state, action) =>
    produce(state, draftState => {
      if (action.payload.groupId != null) {
        const existing = draftState.currentMessages.find(m => m.groupId === action.payload.groupId);
        if (
          existing?.content === action.payload.content &&
          existing?.buttonText === action.payload.buttonText &&
          existing?.header === action.payload.header &&
          existing?.type === action.payload.type
        ) {
          return;
        }
        draftState.currentMessages = draftState.currentMessages.filter(m => m.groupId !== action.payload.groupId);
      }
      draftState.currentMessages.push(action.payload);
    })
  )
  .handleAction(resetMessageUpdate, state =>
    produce(state, draftState => {
      draftState.currentMessages.length = 0;
      draftState.currentMessages.push(...draftState.pendingMessages);
      draftState.pendingMessages.length = 0;
    })
  )
  .handleAction(setCurrentMessageUpdate, (state, action) =>
    produce(state, draftState => {
      draftState.currentMessages = action.payload;
    })
  )
  .handleAction(removeCurrentMessageUpdate, (state, action) =>
    produce(state, draftState => {
      if (action.payload.groupId != null) {
        draftState.currentMessages = draftState.currentMessages.filter(m => m.groupId !== action.payload.groupId);
      }
      if (action.payload.messageId != null) {
        draftState.currentMessages = draftState.currentMessages.filter(m => m.messageId !== action.payload.messageId);
      }
    })
  );
