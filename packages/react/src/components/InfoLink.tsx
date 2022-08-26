import { Link } from "@cloudscape-design/components";
import React, { ReactNode } from "react";
import { useDispatch } from "react-redux";

import { LearnMoreLinks } from "../models/tools";
import { openTools } from "../store/actions/tools";

interface Props {
  heading: string;
  mainContent: ReactNode;
  learnMoreLinks: LearnMoreLinks[];
}

export const InfoLink: React.FC<Props> = React.memo(({ heading, mainContent, learnMoreLinks }) => {
  const dispatch = useDispatch();
  return (
    <Link
      variant="info"
      href="#/"
      onFollow={event => {
        event.preventDefault();
        event.stopPropagation();
        dispatch(
          openTools({
            isOpen: true,
            info: {
              heading,
              mainContent,
              learnMoreLinks
            }
          })
        );
      }}
    >
      Info
    </Link>
  );
});
