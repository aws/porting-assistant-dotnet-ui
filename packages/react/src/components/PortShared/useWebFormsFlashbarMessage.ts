import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuid } from "uuid";

import { pushCurrentMessageUpdate } from "../../store/actions/error";

export const useWebFormsFlashbarMessage = (hasWebForms: boolean) => {
  const dispatch = useDispatch();

  useEffect(() => {
      if(hasWebForms) {
        dispatch(
            pushCurrentMessageUpdate({
                messageId: uuid(),
                groupId: "port",
                type: "info",
                loading: false,
                content: `WebForms Projects will be ported to Blazor.`,
                dismissible: false
            })
        )
      }
      else
      {
          return;
      }
  }, [dispatch, hasWebForms]);
};
