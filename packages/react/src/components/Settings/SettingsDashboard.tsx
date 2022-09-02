import {
  Box,
  Button,
  ColumnLayout,
  Container,
  Header,
  Link as LinkComponent,
  SpaceBetween
} from "@awsui/components-react";
import StatusIndicator from "@awsui/components-react/status-indicator";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { externalUrls } from "../../constants/externalUrls";
import { getProfileName } from "../../utils/getProfileName";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { InfoLink } from "../InfoLink";

const SettingsDashboardInternal: React.FC = () => {
  const isShared = useRef<string>();
  const [profileValid, setProfileValid] = useState<boolean | undefined>(undefined);
  const profileName = useRef<string>();
  const [applicationVersion, setApplicationVersion] = useState<string | undefined>(undefined);
  const [targetFramwork, setTargetFramework] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      profileName.current = await window.electron.getState("profile");
      setProfileValid(await window.electron.verifyUser(profileName.current));
    })();
  }, [profileName]);

  useEffect(() => {
    (async () => {
      setTargetFramework(await getTargetFramework());
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setApplicationVersion(await window.electron.getVersion());
    })();
  }, []);

  const shareState = window.electron.getState("share");
  isShared.current = shareState ? "Enabled" : "Disabled";

  return (
    <SpaceBetween size="m">
      <Header
        variant="h1"
        info={
          <InfoLink
            heading="Set up Porting Assistant for .NET"
            mainContent={
              <p>
                You can change your AWS CLI profile information so that Porting Assistant for .NET can collect metrics
                to improve your experience. These metrics also help flag issues with the software for AWS to quickly
                address. If you have not set up your AWS profile, see Learn More below.
              </p>
            }
            learnMoreLinks={[
              {
                text: "Configuring the AWS CLI",
                externalUrl:
                  "https://docs.aws.amazon.com/portingassistant/latest/userguide/porting-assistant-prerequisites.html#porting-assistant-iam-profile"
              }
            ]}
          />
        }
        actions={
          <Link to="edit-settings">
            <Button variant="primary">Edit</Button>
          </Link>
        }
      >
        Settings
      </Header>
      <Container
        header={
          <Header
            variant="h2"
            description="You can see the AWS named profile that Porting Assistant for .NET is using and also your usage data sharing settings below."
          >
            Porting Assistant for .NET Settings
          </Header>
        }
      >
        <ColumnLayout columns={4} variant="text-grid">
          <SpaceBetween size="l">
            <div>
              <Box margin={{ bottom: "xxxs" }} color="text-label">
                AWS named profile
              </Box>
              <div id="current-profile-name">{getProfileName(profileName.current)}</div>
              {profileValid === false && (
                <Box margin={{ top: "xxs" }} id="current-profile-status">
                  <Box variant="small">
                    <StatusIndicator type="warning">
                      We were unable to reach AWS using your named profile. Click edit to change your named profile to a
                      valid one.
                    </StatusIndicator>
                  </Box>
                </Box>
              )}
            </div>
          </SpaceBetween>
          <SpaceBetween size="l">
            <div>
              <Box margin={{ bottom: "xxxs" }} color="text-label">
                <SpaceBetween direction="horizontal" size="xxs">
                  Usage data sharing
                  <InfoLink
                    heading="Data collected by porting assistant for .Net tool"
                    mainContent={
                      <Box variant="p">
                        When you share your usage data, Porting Assistant for .NET will collect information only about
                        the public NuGet packages, APIs, and stack traces. This information is used to make the Porting
                        Assistant for .NET product better, for example, to improve the package and API replacement
                        recommendations. Porting Assistant for .NET does not collect any identifying information about
                        you.
                      </Box>
                    }
                    learnMoreLinks={[
                      {
                        text: "Learn More",
                        externalUrl: externalUrls.howItWorks
                      }
                    ]}
                  />
                </SpaceBetween>
              </Box>
              <div>{isShared.current || ""}</div>
            </div>
          </SpaceBetween>
          <SpaceBetween size="l">
            <div>
              <Box margin={{ bottom: "xxxs" }} color="text-label">
                Application version
              </Box>
              <div>{applicationVersion}</div>
            </div>
          </SpaceBetween>
          <SpaceBetween size="l">
            <div>
              <Box margin={{ bottom: "xxxs" }} color="text-label">
                Target framework
              </Box>
              <div>{targetFramwork}</div>
            </div>
          </SpaceBetween>
        </ColumnLayout>
      </Container>
      <Container header={<Header variant="h2">End-user license agreement</Header>}>
        <ColumnLayout columns={1} variant="text-grid">
          <SpaceBetween size="l">
            <div>
              <Box variant="p">
                The Porting Assistant for .NET tool is licensed as "AWS Content" under the terms and conditions of the
                AWS Customer Agreement located at{" "}
                <LinkComponent
                  href="#/"
                  onFollow={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    window.electron.openExternalUrl(externalUrls.agreement);
                  }}
                >
                  Agreement
                </LinkComponent>{" "}
                and the Service Terms located at{" "}
                <LinkComponent
                  href="#/"
                  onFollow={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    window.electron.openExternalUrl(externalUrls.serviceTerms);
                  }}
                >
                  Service-Terms
                </LinkComponent>
                . By installing, using or accessing The Porting Assistant for .NET tool, you agree to such terms and
                conditions. The term "AWS Content" does not include software and assets distributed under separate
                license terms (such as code licensed under an open source license).
              </Box>
            </div>
          </SpaceBetween>
        </ColumnLayout>
      </Container>
    </SpaceBetween>
  );
};

export const SettingsDashboard = React.memo(SettingsDashboardInternal);
