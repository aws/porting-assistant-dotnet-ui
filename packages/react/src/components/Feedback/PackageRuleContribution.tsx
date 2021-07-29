import { Box, Button, ColumnLayout, Container, FormField, Header, Input, SpaceBetween } from "@awsui/components-react";
import React, { useEffect, useRef, useState } from "react";

import { RuleContribSource } from "../../containers/RuleContribution";
import { getTargetFramework } from "../../utils/getTargetFramework";

interface Props {
  source: RuleContribSource | undefined;
}

const PackageRuleContributionInternal: React.FC<Props> = ({ source }) => {
  const isShared = useRef<string>();
  const [profileValid, setProfileValid] = useState<boolean | undefined>(undefined);
  const profileName = useRef<string>();
  const email = window.electron.getState("email");
  const [applicationVersion, setApplicationVersion] = useState<string | undefined>(undefined);
  const [targetFramwork, setTargetFramework] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      profileName.current = await window.electron.getState("profile");
      setProfileValid(await window.electron.verifyUser(profileName.current));
    })();
  }, [profileName]);

  useEffect(() => {
    (async () => {
      setTargetFramework(await getTargetFramework());
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setApplicationVersion(await window.electron.getVersion());
    })();
  }, []);

  const shareState = window.electron.getState("share");
  isShared.current = shareState ? "Enabled" : "Disabled";

  return (
    <Container header={<Header variant="h2">NuGet Package Replacement Suggestion Form</Header>}>
      <ColumnLayout columns={1} variant="text-grid">
        <SpaceBetween size="l">
          <div>
            <Box variant="p">
              <FormField description="Your e-mail is auto-filled. To change, please visit settings." label="E-mail">
                <Input value={email} readOnly={true} />
              </FormField>
            </Box>
          </div>
        </SpaceBetween>
      </ColumnLayout>
    </Container>
  );
};

export const PackageRuleContribution = React.memo(PackageRuleContributionInternal);
