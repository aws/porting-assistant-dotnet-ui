import { Box, Button, ColumnLayout, Container, Header, SpaceBetween } from "@awsui/components-react";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { externalUrls } from "../../constants/externalUrls";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { InfoLink } from "../InfoLink";

const SettingsDashboardInternal: React.FC = () => {
  const isShared = useRef<string>();
  const showShareMetrics = useRef<boolean>();
  const [applicationVersion, setApplicationVersion] = useState<string | undefined>(undefined);
  const [targetFramwork, setTargetFramework] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      var profile = await window.electron.getState("profile");
      var useDefaultCreds = await window.electron.getState("useDefaultCreds");
      showShareMetrics.current = profile !== "" || useDefaultCreds;
    })();
  }, [showShareMetrics]);

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
              window.electron.getState("profile") ? (
                <p>
                  You can change your AWS CLI profile information so that Porting Assistant for .NET can collect metrics
                  to improve your experience. These metrics also help flag issues with the software for AWS to quickly
                  address. If you have not set up your AWS profile, see Learn More below.
                </p>
              ) : (
                ""
              )
            }
            learnMoreLinks={
              window.electron.getState("profile")
                ? [
                    {
                      text: "Configuring the AWS CLI",
                      externalUrl:
                        "https://docs.aws.amazon.com/portingassistant/latest/userguide/porting-assistant-prerequisites.html#porting-assistant-iam-profile"
                    }
                  ]
                : []
            }
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
          <Header variant="h2" description="You can see your settings below.">
            Porting Assistant for .NET Settings
          </Header>
        }
      >
        <ColumnLayout columns={4} variant="text-grid">
          {showShareMetrics.current ? (
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
                          the public NuGet packages, APIs, and stack traces. This information is used to make the
                          Porting Assistant for .NET product better, for example, to improve the package and API
                          replacement recommendations. Porting Assistant for .NET does not collect any identifying
                          information about you.
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
          ) : null}
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
    </SpaceBetween>
  );
};

export const SettingsDashboard = React.memo(SettingsDashboardInternal);
