import { Alert, Box, SpaceBetween } from "@cloudscape-design/components";
import React from "react";

import { CodeEntityDetails, Recommendations } from "../../models/project";
import { SummaryItem } from "../AssessShared/SummaryItem";

interface Props {
  recommendations: Recommendations;
  codeEntityDetails: CodeEntityDetails;
}

export const InvocationComment: React.FC<Props> = React.memo(({ codeEntityDetails, recommendations }) => {
  const [visible, setVisible] = React.useState(true);
  const strategy = recommendations?.recommendedActions?.map(recommend => recommend.description).join(",");
  const upgradeSuggestion =
    strategy === "" || strategy == null ? null : <SummaryItem label="Replacement Strategy" content={strategy} />;
  return (
    <Alert onDismiss={() => setVisible(false)} visible={visible} type="warning" header="Incompatible method invocation">
      <SpaceBetween size="s">
        <Box variant="p">{codeEntityDetails?.signature || "-"} </Box>
        <SummaryItem
          label="NuGet package"
          content={`${codeEntityDetails.package?.packageId} ${codeEntityDetails.package?.version}`}
        />
        {upgradeSuggestion}
      </SpaceBetween>
    </Alert>
  );
});
