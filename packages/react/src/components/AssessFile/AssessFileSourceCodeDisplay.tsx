import React, { useMemo } from "react";
import { useLocation } from "react-router";

import { usePortingAssistantSelector } from "../../createReduxStore";
import {
  selectCurrentSourceFileInvocations,
  selectCurrentSourceFilePortingActions,
  selectTargetFramework
} from "../../store/selectors/solutionSelectors";
import { isLoaded, Loadable } from "../../utils/Loadable";
import { Comment, SourceCodeDisplay } from "../HighlighterShared/SourceCodeDisplay";
import { InvocationComment } from "./InvocationComment";
import { RecommendationComment } from "./RecommendationComment";

interface Props {
  sourceFileContent: Loadable<string>;
}

const AssessFileSourceCodeDisplayInternal: React.FC<Props> = ({ sourceFileContent }) => {
  const location = useLocation();
  const apiAnalysisResults = usePortingAssistantSelector(state =>
    selectCurrentSourceFileInvocations(state, location.pathname)
  );
  const portingActionsResults = usePortingAssistantSelector(state =>
    selectCurrentSourceFilePortingActions(state, location.pathname)
  );
  const targetFramework = selectTargetFramework();

  const comments = useMemo(() => {
    if (isLoaded(apiAnalysisResults)) {
      return apiAnalysisResults.data
        .filter(api => {
          if (
            api == null ||
            api?.codeEntityDetails == null ||
            api?.codeEntityDetails?.originalDefinition == null ||
            api?.codeEntityDetails?.textSpan == null ||
            api?.codeEntityDetails?.textSpan?.startLinePosition == null ||
            api?.codeEntityDetails?.textSpan?.endLinePosition == null ||
            api?.codeEntityDetails?.name == null
          ) {
            return false;
          }
          return api.compatibilityResults[targetFramework]?.compatibility === "INCOMPATIBLE";
        })
        .map<Comment>(api => ({
          startLine: api.codeEntityDetails!.textSpan!.startLinePosition!,
          endLine: api.codeEntityDetails!.textSpan!.endLinePosition!,
          comment: (
            <InvocationComment
              recommendations={api.recommendations}
              codeEntityDetails={api.codeEntityDetails}
              key={api.codeEntityDetails!.name}
            />
          )
        }));
    }
    return [];
  }, [apiAnalysisResults, targetFramework]);

  const portingComments = useMemo(() => {
    if (isLoaded(portingActionsResults)) {
      return portingActionsResults.data
        .filter(action => {
          if (
            action == null ||
            action?.textSpan == null ||
            action?.textSpan?.startLinePosition == null ||
            action?.textSpan?.endLinePosition == null
          ) {
            return false;
          }
          return true;
        })
        .map<Comment>(action => ({
          startLine: action!.textSpan!.startLinePosition!,
          endLine: action!.textSpan!.endLinePosition!,
          comment: <RecommendationComment recomendedAction={action} key={Object.values(action.textSpan).join()} />
        }));
    }
    return [];
  }, [portingActionsResults]);

  const isLoading = !isLoaded(sourceFileContent) || apiAnalysisResults == null || !isLoaded(apiAnalysisResults);

  return (
    <SourceCodeDisplay
      sourceFileContent={sourceFileContent}
      title="Code"
      comments={comments.concat(portingComments)}
      isLoading={isLoading}
      highlightMode="csharp"
    />
  );
};

export const AssessFileSourceCodeDisplay = React.memo(AssessFileSourceCodeDisplayInternal);
