import { Header } from "@awsui/components-react";
import React, { ReactNode } from "react";

interface Props {
  totalItems?: any[];
  selectedItems?: any[];
  counter?: string;
  title: string;
  actionButtons?: ReactNode;
  description?: string;
  infoLink?: ReactNode;
}

export const TableHeader: React.FC<Props> = ({
  totalItems,
  selectedItems,
  counter,
  title,
  actionButtons,
  description,
  infoLink
}) => {
  if (!counter) {
    counter = totalItems ? getHeaderCounterText(totalItems, selectedItems) : undefined;
  }
  return (
    <Header variant="h2" info={infoLink} counter={counter} actions={actionButtons} description={description}>
      {title}
    </Header>
  );
};

const getHeaderCounterText = (items: any[], selectedItems?: any[]) => {
  return selectedItems && selectedItems.length > 0 ? `(${selectedItems.length}/${items.length})` : `(${items.length})`;
};
