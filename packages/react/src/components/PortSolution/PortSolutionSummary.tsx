import { Container, Header, Table, TableProps } from "@cloudscape-design/components";
import React from "react";

import { Project } from "../../models/project";
import styles from "../PortShared/Table.module.scss";

interface Props {
  projects: Project[];
}

const PortSolutionSummaryInternal: React.FC<Props> = ({ projects }) => {
  return (
    <Container header={<Header variant="h2">Selected projects</Header>} disableContentPaddings={true}>
      <Table<Project>
        columnDefinitions={columnDefinitions}
        items={projects}
        className={styles.borderless}
        // variant="borderless"
      />
    </Container>
  );
};

const columnDefinitions: TableProps.ColumnDefinition<Project>[] = [
  {
    id: "name",
    header: "Name",
    cell: item => item.projectName
  },
  {
    id: "target-framework",
    header: "Project framework",
    cell: item => item.targetFrameworks?.join(", ") || ""
  }
];

export const PortSolutionSummary = React.memo(PortSolutionSummaryInternal);
