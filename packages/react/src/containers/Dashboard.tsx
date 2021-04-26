import { Alert, Box, Link } from "@awsui/components-react";
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
  const [visible, setVisible] = React.useState(true);
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

  return (
    <PortingAssistantAppLayout
      contentType="table"
      content={
        <>
          <>
            <Alert
              type="info"
              header="Porting Assistant is now available as an extension for Microsoft Visual Studio"
              dismissible={true}
              visible={visible}
              onDismiss={() => setVisible(false)}
              buttonText={
                <>
                  Get the Visual Studio Extension
                  <Link
                    external
                    externalIconAriaLabel="Opens in a new tab"
                    href="#/"
                    onFollow={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      window.electron.openExternalUrl(externalUrls.visualstudioExtension);
                    }}
                  ></Link>
                </>
              }
              onButtonClick={() => {
                window.electron.openExternalUrl(externalUrls.visualstudioExtension);
              }}
            >
              Assess your soluton for .Net Core compatibility and start porting them in Visual Studio.
            </Alert>
          </>
          <DashboardTable />
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
