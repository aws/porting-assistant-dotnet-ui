import { Box } from "@cloudscape-design/components";
import React, { ReactNode } from "react";

interface Props {
  label: string;
  description?: string;
  infoLink?: ReactNode;
  prepend?: ReactNode;
  content: ReactNode;
}

export const SummaryItem: React.FC<Props> = React.memo(({ label, infoLink, prepend, content, description }) => (
  <div>
    <Box margin={{ bottom: "xxxs" }} color="text-label">
      {label} {infoLink}
    </Box>
    <div>{prepend}</div>
    <div>{content}</div>
  </div>
));
