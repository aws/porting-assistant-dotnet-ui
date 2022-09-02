import { Box } from "@awsui/components-react";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { SettingsDashboard } from "../components/Settings/SettingsDashboard";
import { openTools, setInfo } from "../store/actions/tools";

const SettingsInternal: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      setInfo({
        heading: "Settings for Porting Assistant for .NET",
        mainContent: (
          <Box variant="p">
            You can change your AWS CLI profile information or your permission to send metrics. Porting Assistant for
            .NET collects metrics to improve your experience. These metrics also help flag issues with the software for
            AWS to quickly address.
          </Box>
        ),
        learnMoreLinks: []
      })
    );
  }, [dispatch]);

  return (
    <PortingAssistantAppLayout
      content={<SettingsDashboard />}
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumb} />}
      onToolsChange={event => dispatch(openTools({ isOpen: event.detail.open }))}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Settings", href: "/settings" }
];

export const Settings = React.memo(SettingsInternal);
