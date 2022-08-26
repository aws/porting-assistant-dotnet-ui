import { Box, Spinner } from "@cloudscape-design/components";
import classnames from "classnames";
import React, { ReactNode } from "react";

import styles from "./CompatiblePackage.module.scss";

interface Props {
  title: string;
  compatible: number;
  incompatible: number;
  unknown: number;
  isLoading: boolean;
  infoLink: ReactNode;
}

export const CompatiblePackage: React.FC<Props> = React.memo(
  ({ title, compatible, incompatible, unknown, isLoading, infoLink }) => {
    const total = compatible + incompatible + unknown;
    return (
      <div>
        <Box margin={{ bottom: "xxxs" }} color="text-label">
          {title} {infoLink}
        </Box>
        {!isLoading ? (
          <div>
            <div id="compatibility-count" className={styles.packageCount}>{`${incompatible} of ${total}`}</div>
            <Box margin={{ top: "m" }}>
              <div className={styles.bar}>
                {incompatible > 0 && (
                  <div
                    id="incompatible"
                    className={styles.barSection}
                    style={{ width: `${(incompatible / total) * 100}%` }}
                  >
                    <div className={classnames(styles.barColor, styles.gray)} />
                    <div className={styles.barNumber}>{incompatible}</div>
                  </div>
                )}
                {compatible > 0 && (
                  <div
                    id="compatible"
                    className={styles.barSection}
                    style={{ width: `${(compatible / total) * 100}%` }}
                  >
                    <div className={classnames(styles.barColor, styles.white)} />
                    <div className={styles.barNumber}>{compatible}</div>
                  </div>
                )}
              </div>
              <div className={styles.legend}>
                {incompatible > 0 && (
                  <div className={styles.legendSection}>
                    <div className={classnames(styles.legendColor, styles.gray)} />
                    <Box variant="small">Incompatible</Box>
                  </div>
                )}
                {compatible > 0 && (
                  <div className={styles.legendSection}>
                    <div className={classnames(styles.legendColor, styles.white)} />
                    <Box variant="small">Compatible</Box>
                  </div>
                )}
              </div>
            </Box>
          </div>
        ) : (
          <div className={styles.loading}>
            <Spinner size="big" />
          </div>
        )}
      </div>
    );
  }
);
