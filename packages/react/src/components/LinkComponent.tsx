import { Link, LinkProps } from "@awsui/components-react";
import React from "react";
import { useHistory } from "react-router-dom";

interface Props extends LinkProps {
  location: {
    pathName: string;
    state?: {
      solutionOnly?: boolean;
    };
  };
}

const LinkComponentInternal: React.FC<Props> = ({ location, ...props }) => {
  const history = useHistory();
  return (
    <Link
      onFollow={event => {
        event.preventDefault();
        event.stopPropagation();
        history.push(location.pathName, location.state);
      }}
      {...props}
    ></Link>
  );
};

export const LinkComponent = React.memo(LinkComponentInternal);
