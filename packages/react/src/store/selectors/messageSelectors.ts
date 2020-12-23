import { RootState } from "typesafe-actions";

export const currentMessages = (state: RootState) => state.error.currentMessages;
export const pendingMessages = (state: RootState) => state.error.pendingMessages;
