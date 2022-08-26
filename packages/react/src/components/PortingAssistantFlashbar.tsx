import { Flashbar } from "@cloudscape-design/components";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router";

import { removeCurrentMessageUpdate, resetMessageUpdate } from "../store/actions/error";
import { currentMessages } from "../store/selectors/messageSelectors";

interface Props {}

const PortingAssistantFlashbarInternal: React.FC<Props> = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const location = useLocation();
  const currentMessageUpdates = useSelector(currentMessages);

  useEffect(
    () =>
      history.listen((nextLocation, action) => {
        if (action === "PUSH" && location.pathname !== nextLocation.pathname) {
          dispatch(resetMessageUpdate());
        }
      }),
    [dispatch, history, location.pathname]
  );

  const messages = useMemo(
    () =>
      currentMessageUpdates.map(message => ({
        onDismiss: () => {
          dispatch(removeCurrentMessageUpdate({ messageId: message.messageId }));
        },
        ...message
      })),
    [currentMessageUpdates, dispatch]
  );

  return <Flashbar items={messages}></Flashbar>;
};

export const PortingAssistantFlashbar = React.memo(PortingAssistantFlashbarInternal);
