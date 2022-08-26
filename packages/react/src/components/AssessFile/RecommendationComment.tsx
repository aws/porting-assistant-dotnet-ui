import { Alert, Box } from "@cloudscape-design/components";
import React from "react";

import { RecommendedAction } from "../../models/project";

interface Props {
  recomendedAction: RecommendedAction;
}

export const RecommendationComment: React.FC<Props> = React.memo(({ recomendedAction }) => {
  const [visible, setVisible] = React.useState(true);
  return (
    <Alert onDismiss={() => setVisible(false)} visible={visible} type="info" header="Porting action">
      <Box variant="p">
        When you port this project, Porting Assistant for .NET will make the following changes to your source code.
      </Box>
      <Box variant="p">{recomendedAction.description}</Box>
      <Box variant="p">{`The recommendation will work on ${recomendedAction?.targetCPU.slice(0, -1).join(", ")} and ${
        recomendedAction.targetCPU.slice(-1)[0]
      }.`}</Box>
    </Alert>
  );
});
