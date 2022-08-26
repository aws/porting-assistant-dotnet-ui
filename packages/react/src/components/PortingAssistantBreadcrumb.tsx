import { BreadcrumbGroup, BreadcrumbGroupProps } from "@cloudscape-design/components";
import React from "react";
import { useHistory } from "react-router";

interface Props {
  items: BreadcrumbGroupProps.Item[];
}

const PortingAssistantBreadcrumbInternal: React.FC<Props> = ({ items }) => {
  const history = useHistory();
  return (
    <BreadcrumbGroup
      id="breadcrumb"
      ariaLabel="Breadcrumbs"
      items={items}
      onFollow={event => {
        event.preventDefault();
        event.stopPropagation();
        history.push(event.detail.href);
      }}
    />
  );
};

export const PortingAssistantBreadcrumb = React.memo(PortingAssistantBreadcrumbInternal);
