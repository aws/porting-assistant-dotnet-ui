import { Button } from "@cloudscape-design/components";
import classNames from "classnames";
import { MemoryHistory } from "history";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import styles from "./TopBar.module.scss";

export const TopBar: React.FC = React.memo(() => {
  const history = useHistory() as MemoryHistory;

  const [backHover, setBackHover] = useState(false);
  const [forwardHover, setForwardHover] = useState(false);

  // useHistory no longer causes a component to re-render when the history changes.
  // We need to add below to force the TopBar to re-render reach time we change urls.
  const [, forceUpdate] = useState<object>({});
  useEffect(() => {
    history.listen(() => {
      forceUpdate({});
    });
  });

  const backButtonDisabled = !history.canGo(-1);
  const forwardButtonDisabled = !history.canGo(1);

  return (
    <div id="topbar" className={classNames(styles.nav)}>
      <div
        className={styles.navLinkContainer}
        onMouseOver={() => {
          if (backButtonDisabled) {
            return;
          }
          setBackHover(true);
        }}
        onMouseOut={() => {
          setBackHover(false);
        }}
      >
        <Button
          id="nav-back"
          className={classNames({
            [styles.navLink]: true,
            [styles.navLinkDisabled]: backButtonDisabled,
            [styles.navLinkHover]: backHover
          })}
          variant="icon"
          iconName="angle-left"
          disabled={backButtonDisabled}
          onClick={() => history.go(-1)}
        />
      </div>
      <div
        className={styles.navLinkContainer}
        onMouseOver={() => {
          if (forwardButtonDisabled) {
            return;
          }
          setForwardHover(true);
        }}
        onMouseOut={() => {
          setForwardHover(false);
        }}
      >
        <Button
          id="nav-forward"
          className={classNames({
            [styles.navLink]: true,
            [styles.navLinkDisabled]: forwardButtonDisabled,
            [styles.navLinkHover]: forwardHover
          })}
          variant="icon"
          iconName="angle-right"
          disabled={forwardButtonDisabled}
          onClick={() => history.go(1)}
        />
      </div>
    </div>
  );
});
