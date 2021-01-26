import { Box, HelpPanel as HelpPanelComponent, Icon, Link } from "@awsui/components-react";
import React from "react";
import { useSelector } from "react-redux";

import { selectHelpInfo } from "../store/selectors/toolsSelectors";

export const HelpPanel: React.FC = React.memo(() => {
  const data = useSelector(selectHelpInfo);
  return (
    <HelpPanelComponent
      header={<Box variant="h2">{data.info.heading}</Box>}
      footer={
        (data.info.learnMoreLinks.length > 1 && (
          <>
            <h3>
              Learn more <Icon name="external" />
            </h3>
            <ul>
              {data.info.learnMoreLinks.map(link => {
                return (
                  <li key={link.text}>
                    <Link
                      href="#/"
                      onFollow={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        window.electron.openExternalUrl(link.externalUrl);
                      }}
                    >
                      {link.text}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )) ||
        (data.info.learnMoreLinks.length === 1 && (
          <Box margin={{ top: "xl" }}>
            <Link
              href="#/"
              external
              onFollow={event => {
                event.preventDefault();
                event.stopPropagation();
                window.electron.openExternalUrl(data.info.learnMoreLinks[0].externalUrl);
              }}
            >
              {data.info.learnMoreLinks[0].text}
            </Link>
          </Box>
        ))
      }
    >
      {data.info.mainContent}
    </HelpPanelComponent>
  );
});
