import "./CodeTheme.scss";

import { Box, ColumnLayout, Container, Header, Spinner } from "@awsui/components-react";
import classNames from "classnames";
import React, { ReactNode, useMemo, useState } from "react";

import { isLoaded, Loadable } from "../../utils/Loadable";
import { highlight } from "./Highlight";
import styles from "./SourceCodeDisplay.module.scss";

interface Props {
  sourceFileContent: Loadable<string>;
  title: ReactNode;
  comments: Comment[];
  isLoading: boolean;
  highlightMode: "csharp" | "xml";
  buttons?: ReactNode;
  limitRows?: number;
}

export interface Comment {
  startLine: number;
  endLine: number;
  comment: ReactNode;
}

const SourceCodeDisplayInternal: React.FC<Props> = ({
  sourceFileContent,
  title,
  comments,
  isLoading,
  highlightMode,
  buttons,
  limitRows
}) => {
  const [isLimited, setIsLimited] = useState(true);
  const highlightedLines = useMemo(() => {
    if (isLoaded(sourceFileContent)) {
      return highlight(sourceFileContent.data, highlightMode);
    }
    return Array<string>();
  }, [highlightMode, sourceFileContent]);

  const limitedHighlightedLines = useMemo(() => {
    if (isLimited && limitRows !== undefined) {
      return highlightedLines.slice(0, limitRows);
    }
    return highlightedLines;
  }, [highlightedLines, isLimited, limitRows]);

  return (
    <Container
      header={
        <Header variant="h2" description={buttons}>
          {title}
        </Header>
      }
      footer={
        limitRows != null &&
        limitRows !== 0 &&
        !isLoading && (
          <div className={styles.centerContent}>
            <a href="javacript:void(0)" onClick={() => setIsLimited(!isLimited)}>
              {isLimited ? `See all ${highlightedLines.length} lines` : "See less"}
            </a>
          </div>
        )
      }
      disableContentPaddings
    >
      <table className={classNames(styles.highlighter)}>
        {!isLoading ? (
          <tbody className={classNames(styles.theme, "portingAssistant-theme")}>
            {limitedHighlightedLines.map((line, i) => {
              let lineComments = Array<Comment>();
              lineComments.push(...comments.filter(comment => comment.startLine - 1 === i));
              const standardLine = (
                <tr className={styles.line} key={i}>
                  <td
                    className={classNames({ ace_gutter: true, [styles.incompatibleGutter]: lineComments.length > 0 })}
                  >
                    <span className={styles.handle}>{i + 1}</span>
                  </td>
                  <td
                    className={classNames({ ace_line: true, [styles.incompatible]: lineComments.length > 0 })}
                    dangerouslySetInnerHTML={{ __html: `${line}` }}
                  ></td>
                </tr>
              );
              const commentSection =
                lineComments.length > 0 ? (
                  <tr className={styles.lineComment} key={`${i}-comment`}>
                    <td colSpan={2}>
                      <ColumnLayout borders="horizontal" disableGutters={true}>
                        {lineComments.map(lineComment => lineComment.comment)}
                      </ColumnLayout>
                    </td>
                  </tr>
                ) : null;
              return [standardLine, commentSection];
            })}
          </tbody>
        ) : (
          <tbody>
            <tr>
              <td className={styles.centerContent}>
                <Box padding="l">
                  <Spinner />
                </Box>
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </Container>
  );
};

export const SourceCodeDisplay = React.memo(SourceCodeDisplayInternal);
