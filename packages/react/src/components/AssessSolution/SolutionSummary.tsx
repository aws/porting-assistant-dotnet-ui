import { Box, ColumnLayout, Container, Header, SpaceBetween, Spinner } from "@cloudscape-design/components";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { v4 as uuid } from "uuid";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { Project } from "../../models/project";
import { SolutionDetails } from "../../models/solution";
import { pushCurrentMessageUpdate, removeCurrentMessageUpdate } from "../../store/actions/error";
import {
  selectCurrentSolutionApiAnalysis,
  selectCurrentSolutionDetails,
  selectNugetPackages
} from "../../store/selectors/solutionSelectors";
import { getActionCounts, getErrorCounts } from "../../store/selectors/tableSelectors";
import { API_LOADING_AGGREGATE, getCompatibleApi } from "../../utils/getCompatibleApi";
import { getCompatibleNugetsAgg, LOADING_AGGREGATES } from "../../utils/getCompatibleNugets";
import { getTargetFramework } from "../../utils/getTargetFramework";
import { isLoaded, Loadable } from "../../utils/Loadable";
import { CompatiblePackage } from "../AssessShared/CompatiblePackage";
import { SummaryItem } from "../AssessShared/SummaryItem";
import { InfoLink } from "../InfoLink";

interface Props {
  solution: SolutionDetails;
  projects: Loadable<Project[]>;
}

const SolutionSummaryInternal: React.FC<Props> = ({ solution, projects }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const nugetPackages = useSelector(selectNugetPackages);
  const solutionProjects = usePortingAssistantSelector(state => selectCurrentSolutionDetails(state, location.pathname));
  const apiAnalysis = usePortingAssistantSelector(state => selectCurrentSolutionApiAnalysis(state, location.pathname));
  const targetFramework = getTargetFramework();
  const nugetCompatibilities = useMemo(() => {
    if (!isLoaded(projects)) {
      return LOADING_AGGREGATES;
    }
    return getCompatibleNugetsAgg(
      projects.data.flatMap(p => p.packageReferences || []),
      nugetPackages
    );
  }, [nugetPackages, projects]);

  const apiCompatibilities = useMemo(() => {
    if (!isLoaded(projects)) {
      return API_LOADING_AGGREGATE;
    }
    if (projects.data.length === 0) {
      return {
        failureCount: 0,
        isApisLoading: false,
        values: [0, 0]
      };
    }
    return getCompatibleApi(solutionProjects, apiAnalysis, null, null, targetFramework);
  }, [apiAnalysis, projects, solutionProjects, targetFramework]);

  const buildErrors = useMemo(() => {
    if (!isLoaded(projects)) {
      return 0;
    }
    if (projects.data.length === 0) {
      return 0;
    }
    return getErrorCounts(apiAnalysis);
  }, [apiAnalysis, projects]);

  const portingActions = useMemo(() => {
    if (!isLoaded(projects)) {
      return 0;
    }
    if (projects.data.length === 0) {
      return 0;
    }
    return getActionCounts(apiAnalysis);
  }, [apiAnalysis, projects]);

  const [shownLoadingMessage, setShownLoadingMessage] = useState(false);
  useEffect(() => {
    if (!nugetCompatibilities.isAllNugetLoaded || apiCompatibilities.isApisLoading) {
      dispatch(
        pushCurrentMessageUpdate({
          messageId: uuid(),
          groupId: "assess",
          type: "success",
          loading: true,
          content: `Assessing your source code. This can take a few minutes.`,
          dismissible: false
        })
      );
      setShownLoadingMessage(true);
    } else if (shownLoadingMessage) {
      dispatch(
        pushCurrentMessageUpdate({
          messageId: uuid(),
          groupId: "assessSuccess",
          type: "success",
          content: `Successfully assessed your source code.`,
          dismissible: true
        })
      );
      dispatch(removeCurrentMessageUpdate({ groupId: "assess" }));
      setShownLoadingMessage(false);
    }
  }, [apiCompatibilities.isApisLoading, dispatch, nugetCompatibilities.isAllNugetLoaded, shownLoadingMessage]);

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={
            <Box variant="small">
              The level of compatibility will affect the effort required to port your solution to .NET Core.
            </Box>
          }
        >
          Assessment overview
        </Header>
      }
    >
      <ColumnLayout columns={3} variant="text-grid">
        <div>
          <SpaceBetween size="l">
            <CompatiblePackage
              title="Incompatible NuGet packages"
              compatible={nugetCompatibilities.nugetAggregates.compatible}
              incompatible={nugetCompatibilities.nugetAggregates.incompatible}
              unknown={nugetCompatibilities.nugetAggregates.unknown}
              isLoading={!nugetCompatibilities.isAllNugetLoaded}
              infoLink={
                <InfoLink
                  heading="Incompatible NuGet packages"
                  mainContent={
                    <Box variant="p">
                      Porting Assistant for .NET parses package reference files for each project in the .NET Framework
                      solution and iterates through each referenced public and private NuGet package to check whether
                      the latest version of the package that is compatible with .NET Core is available. To speed up the
                      process, Porting Assistant for .NET includes a precompiled database of all public NuGet packages
                      and their compatibility status. For private packages, Porting Assistant for .NET uses dotnet tools
                      to determine the compatibility of a package.
                    </Box>
                  }
                  learnMoreLinks={[
                    {
                      externalUrl: "https://docs.microsoft.com/en-us/nuget/what-is-nuget",
                      text: "An introduction to NuGet"
                    }
                  ]}
                />
              }
            />
          </SpaceBetween>
        </div>
        <div>
          <SpaceBetween size="l">
            <CompatiblePackage
              title="Incompatible APIs"
              compatible={apiCompatibilities.values[0]}
              incompatible={apiCompatibilities.values[1] - apiCompatibilities.values[0]}
              unknown={0}
              isLoading={apiCompatibilities.isApisLoading}
              infoLink={
                <InfoLink
                  heading="Incompatible APIs"
                  mainContent={
                    <Box variant="p">
                      Porting Assistant for .NET analyzes source code of your .NET application. It identifies
                      incompatible API calls made from each NuGet package and checks whether a NuGet package is
                      compatible with .NET Core.
                    </Box>
                  }
                  learnMoreLinks={[]}
                />
              }
            />
          </SpaceBetween>
        </div>
        <div>
          <SpaceBetween size="l">
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <SummaryItem
                  label="Build errors"
                  infoLink={
                    <InfoLink
                      heading="Build errors"
                      mainContent={<Box variant="p">The number of build errors in the assessed solution.</Box>}
                      learnMoreLinks={[]}
                    />
                  }
                  content={apiCompatibilities.isApisLoading ? <Spinner /> : buildErrors}
                />
              </div>
              <div>
                <SummaryItem
                  label="Porting actions"
                  infoLink={
                    <InfoLink
                      heading="Porting actions"
                      mainContent={<Box variant="p">The number of porting actions in the assessed solution.</Box>}
                      learnMoreLinks={[]}
                    />
                  }
                  content={apiCompatibilities.isApisLoading ? <Spinner /> : portingActions}
                />
              </div>
            </ColumnLayout>
            <SummaryItem label="Filepath" content={solution.solutionFilePath} />
          </SpaceBetween>
        </div>
      </ColumnLayout>
    </Container>
  );
};

export const SolutionSummary = React.memo(SolutionSummaryInternal);
