import { Alert, Box, Icon, SpaceBetween } from "@awsui/components-react";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";

import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { ProfileSelection } from "../components/Setup/ProfileSelection";
import { externalUrls } from "../constants/externalUrls";
import { usePortingAssistantSelector } from "../createReduxStore";
import { openTools, setInfo } from "../store/actions/tools";

const SetupInternal: React.FC = () => {
  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    dispatch(
      setInfo({
        heading: "Set up Porting Assistant for .NET",
        mainContent: (
          <Box variant="p">
            When you start the assistant for the first time, you are prompted to enter your AWS CLI profile information
            so that Porting Assistant for .NET can collect metrics to improve your experience. These metrics also help
            flag issues with the software for AWS to quickly address. If you have not set up your AWS CLI profile, see
            configuring the AWS CLI below.
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

  return (
    <PortingAssistantAppLayout
      content={
        <ProfileSelection
          title="Set up Porting Assistant for .NET"
          buttonText="Next"
          next={() => history.push("/add-solution")}
        />
      }
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumb} />}
      maxContentWidth={800}
      minContentWidth={600}
      onToolsChange={event => dispatch(openTools({ isOpen: event.detail.open }))}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Set up Porting Assistant for .NET", href: "/setup" }
];

export const Setup = React.memo(SetupInternal);
