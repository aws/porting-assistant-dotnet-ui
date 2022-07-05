import { Alert, Box, Icon, SpaceBetween } from "@awsui/components-react";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";

import { DashboardTable } from "../components/Dashboard/DashboardTable";
import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { externalUrls } from "../constants/externalUrls";
import { setInfo } from "../store/actions/tools";

const DashboardInternal: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const notification = window.electron.getState("notification");
  const [visible, setVisible] = React.useState(notification);
  const newVersionNotification = window.electron.getState("newVersionNotification");
  const [visibleNewVersion, setVisibleNewVersion] = React.useState(false);
  const [latestAppVersion, setlatestAppVersion] = React.useState<string | undefined>(undefined);
  useEffect(() => {
    dispatch(
      setInfo({
        heading: "Assessed solutions",
        mainContent: (
          <>
            <Box variant="p">
              Select a solution to view the solution details, including an assessment overview. You can also port your
              projects when you have attained your desired compatibility for the projects. To reassess a solution,
              choose Reassess solution. To assess a new solution choose the Assess a new solution button.
            </Box>

            <Box variant="h4">Build errors</Box>
            <Box variant="p">The number of build errors in the solution.</Box>
          </>
        ),
        learnMoreLinks: [
          {
            text: "How Porting Assistant for .NET works",
            externalUrl: externalUrls.howItWorks
          }
        ]
      })
    );
  }, [dispatch, location]);

  useEffect(() => {
    (async () => {
      setlatestAppVersion(await window.electron.getLatestVersion());
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setVisibleNewVersion((await window.electron.getOutdatedVersionFlag()) && newVersionNotification);
    })();
  }, []);

  return (
    <PortingAssistantAppLayout
      contentType="table"
      content={
        <>
          <SpaceBetween direction="vertical" size="xs">
            <Alert
              type="info"
              header="New version of Porting Assistant for .NET is available."
              dismissible={true}
              visible={visibleNewVersion}
              onDismiss={() => {
                setVisibleNewVersion(false);
                window.electron.saveState("newVersionNotification", false);
              }}
              buttonText={
                <SpaceBetween direction="horizontal" size="xxs">
                  <div>Get the Release Note</div>
                  <div>
                    <Icon name="external" size="normal" variant="normal" />
                  </div>
                </SpaceBetween>
              }
              onButtonClick={() => {
                window.electron.openExternalUrl(externalUrls.releaseNotes);
              }}
            >
              Check new features of Porting Assistant for .NET - Version {latestAppVersion}.
            </Alert>
            <Alert
              type="info"
              header="Porting Assistant for .NET is now available as an extension for Microsoft Visual Studio"
              dismissible={true}
              visible={visible}
              onDismiss={() => {
                setVisible(false);
                window.electron.saveState("notification", false);
              }}
              buttonText={
                <SpaceBetween direction="horizontal" size="xxs">
                  <div>Get the Visual Studio extension</div>
                  <div>
                    <Icon name="external" size="normal" variant="normal" />
                  </div>
                </SpaceBetween>
              }
              onButtonClick={() => {
                window.electron.openExternalUrl(externalUrls.visualstudioExtension);
              }}
            >
              Assess your solution for .NET Core compatibility and start porting them in Visual Studio.
            </Alert>
            <DashboardTable />
          </SpaceBetween>
        </>
      }
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumb} />}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Assessed solutions", href: "/solutions" }
];

export const Dashboard = React.memo(DashboardInternal);
