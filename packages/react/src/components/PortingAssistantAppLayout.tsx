import { AppLayout, AppLayoutProps } from "@cloudscape-design/components";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { openTools } from "../store/actions/tools";
import { selectHelpInfo } from "../store/selectors/toolsSelectors";
import { HelpPanel } from "./HelpPanel";
import { PortingAssistantFlashbar } from "./PortingAssistantFlashbar";
import { Sidebar } from "./Sidebar";

interface Props extends AppLayoutProps {
  defaultNavOpen?: boolean;
}

export const PortingAssistantAppLayout: React.FC<Props> = ({ ...props }) => {
  const dispatch = useDispatch();
  const tools = useSelector(selectHelpInfo);
  const [isNavOpen, setIsNavOpen] = useState<boolean>(props.defaultNavOpen || false);
  return (
    <AppLayout
      notifications={<PortingAssistantFlashbar />}
      headerSelector="#topbar"
      toolsOpen={tools.isOpen}
      tools={<HelpPanel />}
      navigation={<Sidebar />}
      navigationOpen={isNavOpen}
      onNavigationChange={event => {
        console.log(event.detail.open);
        setIsNavOpen(event.detail.open);
      }}
      onToolsChange={event => dispatch(openTools({ isOpen: event.detail.open }))}
      {...props}
    />
  );
};
