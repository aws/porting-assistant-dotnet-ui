import { Box } from "@awsui/components-react";
import React, { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";
import { v4 as uuid } from "uuid";

import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { ProfileSelecion } from "../components/Setup/ProfileSelection";
import { pushPendingMessageUpdate } from "../store/actions/error";
import { openTools, setInfo } from "../store/actions/tools";

const EditSettingsInternal: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    dispatch(
      setInfo({
        heading: "Set up Porting Assistant for .NET",
        mainContent: (
          <Box variant="p">
            You can change your AWS CLI profile information so that Porting Assistant for .NET can collect metrics to
            improve your experience. These metrics also help flag issues with the software for AWS to quickly address.
            If you have not set up your AWS profile, see Learn More below.
          </Box>
        ),
        learnMoreLinks: [
          {
            text: "Configuring the AWS CLI",
            externalUrl:
              "https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html#cli-quick-configuration"
          }
        ]
      })
    );
  }, [dispatch]);

  const setPendingMessage = useCallback(() => {
    dispatch(
      pushPendingMessageUpdate({
        messageId: uuid(),
        type: "success",
        content: "Successfully updated settings",
        dismissible: true
      })
    );
    history.push("/settings");
  }, [dispatch, history]);

  return (
    <PortingAssistantAppLayout
      contentType="form"
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumb} />}
      content={<ProfileSelecion title="Edit settings" buttonText="Save" next={setPendingMessage} />}
      onToolsChange={event => dispatch(openTools({ isOpen: event.detail.open }))}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Settings", href: "/settings" },
  { text: "Edit settings", href: "/edit-settings" }
];

export const EditSettings = React.memo(EditSettingsInternal);
