import { Box, Header, SpaceBetween } from "@awsui/components-react";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { PackageRuleContribution } from "../components/CustomerContribution/PackageRuleContribution";
import { InfoLink } from "../components/InfoLink";
import { PortingAssistantAppLayout } from "../components/PortingAssistantAppLayout";
import { PortingAssistantBreadcrumb } from "../components/PortingAssistantBreadcrumb";
import { HistoryState } from "../models/locationState";
import { openTools, setInfo } from "../store/actions/tools";
import { RootState } from "../store/reducers";
import { selectCurrentSolutionDetails } from "../store/selectors/solutionSelectors";
import { isLoaded } from "../utils/Loadable";

export type Contribution = "API" | "PACKAGE";

export interface RuleContribSource {
  type: Contribution;
  apiName?: string;
  packageName: string;
  packageVersion: string | undefined;
}

const RuleContributionInternal: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation<HistoryState>();

  const { ruleContribSourceInfo } = location.state;

  const emptyRuleContrib: RuleContribSource = {
    type: "PACKAGE",
    packageName: "",
    packageVersion: ""
  };

  const ruleContribSource = ruleContribSourceInfo ? ruleContribSourceInfo : emptyRuleContrib;

  const currentSolutionDetails = useSelector((state: RootState) =>
    selectCurrentSolutionDetails(state, location.pathname)
  );

  const info = {
    heading: "Suggest replacement",
    mainContent: (
      <Box variant="p">
        You can change your AWS CLI profile information or your permission to send metrics. Porting Assistant for .NET
        collects metrics to improve your experience. These metrics also help flag issues with the software for AWS to
        quickly address.
      </Box>
    ),
    learnMoreLinks: []
  };

  useEffect(() => {
    dispatch(setInfo(info));
    // eslint-disable-next-line
  }, [dispatch]);

  const breadcrumbWithCurrent = useMemo(() => {
    if (currentSolutionDetails == null || !isLoaded(currentSolutionDetails)) {
      return [];
    }
    return [
      ...breadcrumb,
      {
        text: currentSolutionDetails.data.solutionName,
        href: `/solutions/${encodeURIComponent(currentSolutionDetails.data.solutionFilePath)}`
      },
      { text: "Suggest replacement", href: "" }
    ];
  }, [currentSolutionDetails]);

  return (
    <PortingAssistantAppLayout
      content={
        <SpaceBetween size="m">
          <Header
            variant="h1"
            info={
              <InfoLink heading={info.heading} mainContent={info.mainContent} learnMoreLinks={info.learnMoreLinks} />
            }
          >
            Suggest replacement
          </Header>
          <PackageRuleContribution source={ruleContribSource} />
        </SpaceBetween>
      }
      breadcrumbs={<PortingAssistantBreadcrumb items={breadcrumbWithCurrent} />}
      onToolsChange={event => dispatch(openTools({ isOpen: event.detail.open }))}
    />
  );
};

const breadcrumb = [
  { text: "Porting Assistant for .NET", href: "/main" },
  { text: "Assessed solutions", href: "/solutions" }
];

export const RuleContribution = React.memo(RuleContributionInternal);
