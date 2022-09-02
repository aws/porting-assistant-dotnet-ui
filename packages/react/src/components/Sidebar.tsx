import { SideNavigation, SideNavigationProps } from "@awsui/components-react";
import React from "react";
import { useHistory, useLocation } from "react-router";

import { externalUrls } from "../constants/externalUrls";

const SidebarInternal: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  return (
    <SideNavigation
      id="sidebar"
      activeHref={location.pathname}
      header={header}
      items={items}
      onFollow={event => {
        event.preventDefault();
        event.stopPropagation();
        if (!event.detail.external) {
          history.push(event.detail.href);
        } else {
          window.electron.openExternalUrl(event.detail.href);
        }
      }}
    ></SideNavigation>
  );
};

const header = { href: "/main", text: "Porting Assistant for .NET" };
const items: SideNavigationProps.Item[] = [
  { type: "link", text: "Assessed solutions", href: "/solutions" },
  { type: "link", text: "Settings", href: "/settings" },
  { type: "divider" },
  {
    type: "link",
    text: "Contribute on Github",
    href: externalUrls.github,
    external: true
  },
  {
    type: "link",
    text: "Visual Studio Extension",
    href: externalUrls.visualstudioExtension,
    external: true
  },
  {
    type: "link",
    text: "Documentation",
    href: externalUrls.defaultDocumentation,
    external: true
  },
  {
    type: "link",
    text: "Send Feedback",
    href: `mailto:${externalUrls.email}?subject=Feedback - Porting Assistant for .NET`,
    external: true
  }
];

export const Sidebar = React.memo(SidebarInternal);
