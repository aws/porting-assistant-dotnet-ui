import {
  Box,
  Button,
  ColumnLayout,
  Container,
  Grid,
  Header,
  Icon,
  Link as LinkComponent,
  SpaceBetween
} from "@awsui/components-react";
import React from "react";
import { Link } from "react-router-dom";

import { externalUrls } from "../constants/externalUrls";
import { usePortingAssistantSelector } from "../createReduxStore";
import styles from "./MainContent.module.scss";

const MainContentInternal: React.FC = () => {
  const isProfileSet = usePortingAssistantSelector(state => state.solution.profileSet);
  return (
    <Box margin={{ bottom: "l" }} padding="xs">
      <Grid className={styles.customHomeHeader} gridDefinition={[{ colspan: { xxs: 12 } }]}>
        <Box padding={{ vertical: "xxl" }}>
          <Grid
            gridDefinition={[
              { offset: { l: 2, xxs: 1 }, colspan: { l: 8, xxs: 10 } },
              { colspan: { xl: 6, l: 5, s: 6, xxs: 10 }, offset: { l: 2, xxs: 1 } },
              { colspan: { xl: 2, l: 3, s: 4, xxs: 10 }, offset: { s: 0, xxs: 1 } }
            ]}
          >
            <Box fontWeight="light" padding={{ top: "xs" }}>
              <span className={styles.customHomeCategory}>Developer Tools</span>
            </Box>
            <div className={styles.customHomeHeaderTitle}>
              <Box variant="h1" fontWeight="bold" padding="n" fontSize="display-l" color="inherit">
                Porting Assistant for .NET
              </Box>
              <Box fontWeight="light" padding={{ bottom: "s" }} fontSize="display-l" color="inherit">
                Port your .NET Framework application to .NET Core with assistance and insights
              </Box>
              <Box variant="p" fontWeight="light">
                <span className={styles.customHomeHeaderSubTitle}>
                  Porting Assistant for .NET is an analysis tool that scans .NET Framework applications and generates a
                  .NET Core compatibility assessment, which helps you to quickly port your applications to Linux.
                </span>
              </Box>
              <Box variant="p" fontWeight="light">
                <span className={styles.customHomeHeaderSubTitle}>
                  Porting Assistant for .NET scans .NET Framework applications to identify incompatibilities with .NET
                  Core, finds known replacements, and generates detailed compatibility assessment reports. The manual
                  effort to modernize your applications to Linux is minimized.{" "}
                </span>
              </Box>
            </div>
            <Container>
              <SpaceBetween size="xl">
                <Box variant="h2" padding="n">
                  Assess the .NET Core compatibility of a solution
                </Box>
                <Link to={isProfileSet ? "/solutions" : "/setup"}>
                  <Button id="start-btn" variant="primary">
                    Get started
                  </Button>
                </Link>
              </SpaceBetween>
            </Container>
          </Grid>
        </Box>
      </Grid>

      <Box margin={{ top: "m" }} padding={{ top: "xxl" }}>
        <Grid
          gridDefinition={[
            { colspan: { xl: 6, l: 5, s: 6, xxs: 10 }, offset: { l: 2, xxs: 1 } },
            { colspan: { xl: 2, l: 3, s: 4, xxs: 10 }, offset: { s: 0, xxs: 1 } }
          ]}
        >
          <div className={styles.customHomeMainContentArea}>
            <SpaceBetween size="l">
              <div>
                <Header variant="h1" headingTagOverride="h2">
                  How it works
                </Header>
                <Container>
                  <div className={styles.customHomeImagePlaceholder}>
                    <img src="product-page-diagram_Porting-Assistant-for-NET.png" alt="How it works" />
                  </div>
                </Container>
              </div>

              <div>
                <Header variant="h1" headingTagOverride="h2">
                  Benefits and features
                </Header>
                <Container>
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="h3" padding={{ top: "n" }}>
                        Quickly prioritize
                      </Box>
                      <Box variant="p">
                        Scan the entire .NET Framework application portfolio to generate compatibility assessment
                        reports. Prioritize applications for porting based on the amount of effort required.
                      </Box>
                    </div>
                    <div>
                      <Box variant="h3" padding={{ top: "n" }}>
                        Reduce manual effort
                      </Box>
                      <Box variant="p">
                        Identify incompatible .NET Core APIs and custom packages from your .NET Framework applications,
                        and find known replacements to reduce the manual effort required to search for replaceable
                        packages and APIs.
                      </Box>
                    </div>
                  </ColumnLayout>
                </Container>
              </div>
              <div>
                <Container>
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="h3" padding={{ top: "n" }}>
                        Compatibility assessment
                      </Box>
                      <Box variant="p">
                        Porting Assistant for .NET scans the source code and NuGet packages of your .NET applications at
                        the solution (.sln) level, and generates a compatibility assessment report.
                      </Box>
                    </div>
                    <div>
                      <Box variant="h3" padding={{ top: "n" }}>
                        Replacement suggestions
                      </Box>
                      <Box variant="p">
                        Porting Assistant for .NET identifies incompatible packages and APIs in the source code, and
                        provides available known replacements. The API replacement engine of the Porting Assistant for
                        .NET continuously improves as it learns more about the incompatible packages and APIs.
                      </Box>
                    </div>
                    <div>
                      <Box variant="h3" padding={{ top: "n" }}>
                        Assisted porting
                      </Box>
                      <Box variant="p">
                        Porting Assistant for .NET upgrades packages to their latest compatible version and changes
                        relevant project reference files to a .NET Core compatible format so that you can easily
                        refactor your source code for .NET Core.
                      </Box>
                    </div>
                    <div>
                      <Box variant="h3" padding={{ top: "n" }}>
                        Project dependency visualization
                      </Box>
                      <Box variant="p">
                        Porting Assistant for .NET creates a graphical user interface to help you visualize project
                        dependencies within a solution file. This interface helps you to assess the impact of changes at
                        the solution level.
                      </Box>
                    </div>
                  </ColumnLayout>
                </Container>
              </div>
            </SpaceBetween>
          </div>
          <div className={styles.customHomeSidebar}>
            <SpaceBetween size="xxl">
              <Container header={<Header variant="h2">Pricing (US)</Header>}>
                <span>Porting Assistant for .NET is offered as a free tool.</span>
              </Container>
              <Container
                header={
                  <Header variant="h2">
                    More resources <Icon name="external" />
                  </Header>
                }
              >
                <div>
                  <ul aria-label="Additional resource links" className={styles.customListSeparator}>
                    <li>
                      <LinkComponent
                        href="#/"
                        onFollow={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          window.electron.openExternalUrl(externalUrls.defaultDocumentation);
                        }}
                      >
                        Documentation
                      </LinkComponent>
                    </li>
                  </ul>
                </div>
              </Container>
            </SpaceBetween>
          </div>
        </Grid>
      </Box>
    </Box>
  );
};

export const MainContent = React.memo(MainContentInternal);
