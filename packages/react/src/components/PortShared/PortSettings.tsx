import { Box, ColumnLayout, Container, FormField, Header } from "@awsui/components-react";
import React from "react";

import { PortingLocation } from "../../models/porting";
import { SolutionDetails } from "../../models/solution";
import { getPortingSolutionPath } from "../../utils/getPortingSolutionPath";

interface Props {
  solutionDetails: SolutionDetails;
  portingLocation: PortingLocation;
  targetFramework: string;
}

const PortSettingsInternal: React.FC<Props> = ({ solutionDetails, portingLocation, targetFramework }) => {
  return (
    <Container header={<Header variant="h2">Port settings</Header>}>
      <ColumnLayout>
        <div>
          <Box margin={{ bottom: "l" }}>
            <Box margin={{ bottom: "xxxs" }} color="text-label">
              Port destination
            </Box>
            <div>{getPortingSolutionPath(solutionDetails, portingLocation)}</div>
          </Box>
          <FormField
            label="New target framework version"
            description="Target framework to port the selected projects to."
          >
            {targetFramework}
          </FormField>
        </div>
      </ColumnLayout>
    </Container>
  );
};

export const PortSettings = React.memo(PortSettingsInternal);
