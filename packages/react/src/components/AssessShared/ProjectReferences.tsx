import { Box, Button, Container, Header, SpaceBetween } from "@awsui/components-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { Network } from "vis-network/standalone";

import { usePortingAssistantSelector } from "../../createReduxStore";
import { Project } from "../../models/project";
import { selectCurrentSolutionPath } from "../../store/selectors/solutionSelectors";
import { hasNewData, Loadable } from "../../utils/Loadable";
import { InfoLink } from "../InfoLink";
import styles from "./ProjectReferences.module.scss";

interface Props {
  projects: Loadable<Project[]>;
}

const ProjectReferencesInternal: React.FC<Props> = ({ projects }) => {
  const history = useHistory();
  const location = useLocation();
  const solutionPath = usePortingAssistantSelector(state => selectCurrentSolutionPath(state, location.pathname));
  const [selectedNode, setSelectedNode] = useState<string | undefined>(undefined);
  const data = useMemo(() => {
    if (!hasNewData(projects)) {
      return null;
    }
    return {
      nodes: projects.data
        .map(project => ({
          id: project.projectFilePath,
          label: project.projectName || ""
        }))
        .reduce((agg, p) => {
          if (!agg.some(a => a.id === p.id)) {
            agg.push(p);
          }
          return agg;
        }, Array<{ id: string; label: string }>()),
      edges: projects.data.flatMap(
        project =>
          project.projectReferences
            ?.map(ref => ({
              from: project.projectFilePath,
              to: ref.referencePath || "",
              id: `${project.projectFilePath}-${ref.referencePath || ""}`
            }))
            .reduce((agg, e) => {
              if (!agg.some(a => a.id === e.id)) {
                agg.push(e);
              }
              return agg;
            }, Array<{ from: string; to: string; id: string }>()) || []
      )
    };
  }, [projects]);

  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current === null || data === null) {
      return;
    }
    const network = new Network(divRef.current, data, {
      height: `${data.nodes.length * 10 + 500}px`,
      edges: {
        arrows: {
          to: true
        },
        color: {
          color: "#d5dbdb",
          highlight: "#12293b"
        },
        selectionWidth: 0
      },
      nodes: {
        shape: "box",
        borderWidthSelected: 1,
        labelHighlightBold: false,
        color: {
          border: "#aab7b8",
          background: "#ffffff",
          highlight: {
            border: "#0a4a74",
            background: "#ffffff"
          }
        },
        shapeProperties: {
          borderRadius: 0
        }
      },
      layout: {
        randomSeed: 3
      },
      interaction: {
        zoomView: true,
        dragNodes: true,
        dragView: true
      },
      physics: {
        enabled: true,
        solver: "forceAtlas2Based"
      }
    });

    network.on("selectNode", param => {
      const nodeId = param.nodes[0];
      setSelectedNode(nodeId);
    });

    network.on("deselectNode", () => {
      setSelectedNode(undefined);
    });

    return () => network && network.destroy();
  }, [divRef, data]);

  if (!hasNewData(projects)) {
    return <div>Loading</div>;
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          info={
            <InfoLink
              heading="Project references graph"
              mainContent={
                <Box variant="p">
                  To port your projects, we recommend that you start by looking at the base of your solution, and then
                  moving outward to test each layer. You should first port base projects that have dependencies from the
                  most projects. In other words, port projects showing more inward arrows than outward arrows in the
                  graph.
                </Box>
              }
              learnMoreLinks={[]}
            />
          }
          description={
            <Box variant="small">
              The following projects are most referenced by other projects. Use this graph to determine which project to
              port first. Select a node to see its project dependencies.
            </Box>
          }
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                id="view-details-button"
                disabled={selectedNode == null}
                onClick={() => {
                  if (selectedNode != null) {
                    history.push(`/solutions/${encodeURIComponent(solutionPath)}/${encodeURIComponent(selectedNode)}`);
                  }
                }}
              >
                View details
              </Button>
            </SpaceBetween>
          }
        >
          Project references graph
        </Header>
      }
    >
      <div>
        <div id="project-dependencies" className={styles.projectDependencies} ref={divRef}></div>
      </div>
    </Container>
  );
};

export const ProjectReferences = React.memo(ProjectReferencesInternal);
