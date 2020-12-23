import { createAction } from "typesafe-actions";

import { Message } from "../../models/error";

export const pushPendingMessageUpdate = createAction("pushPendingMessageUpdate")<Message>();
export const resetMessageUpdate = createAction("resetMessageUpdate")();
export const pushCurrentMessageUpdate = createAction("pushCurrentMessageUpdate")<Message>();
export const setCurrentMessageUpdate = createAction("setCurrentMessageUpdate")<Message[]>();
export const removeCurrentMessageUpdate = createAction("removeCurrentMessageUpdate")<{
  messageId?: string;
  groupId?: string;
}>();
export const setErrorUpdate = createAction("setErrorUpdate")<any>();
