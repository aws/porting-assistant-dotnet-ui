import React from "react";
import { useDispatch } from "react-redux";

import { MainContent } from "../components/MainContent";
import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { usePortingAssistantSelector } from "../createReduxStore";
import { openTools } from "../store/actions/tools";

const MainInternal: React.FC = () => {
  const dispatch = useDispatch();
  const profileSet = usePortingAssistantSelector(state => state.solution.profileSet);

  return (
    <PortingAssistantAppLayout
      disableContentPaddings={true}
      content={<MainContent />}
      navigationHide={!profileSet}
      navigationOpen={profileSet}
      toolsHide={true}
      onToolsChange={event => dispatch(openTools({ isOpen: event.detail.open }))}
    />
  );
};

export const Main = React.memo(MainInternal);
