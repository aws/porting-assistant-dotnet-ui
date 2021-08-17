import {
  Box,
  Button,
  Checkbox,
  ColumnLayout,
  Container,
  Form,
  FormField,
  Header,
  Input,
  Select,
  SpaceBetween
} from "@awsui/components-react";
import { MemoryHistory } from "history";
import path from "path";
import React, { useCallback, useState } from "react";
import { useLocation } from "react-router";
import { Link, useHistory } from "react-router-dom";

import { EnterEmailModal, isEmailSet } from "../../components/AssessShared/EnterEmailModal";
import { RuleContribSource } from "../../containers/RuleContribution";
import { TargetFramework } from "../../models/localStoreSchema";
import { HistoryState } from "../../models/locationState";
import { uploadRuleContribution } from "../../utils/uploadToS3Bucket";
import { targetFrameworkOptions } from "../Setup/ProfileSelection";

interface Props {
  source: RuleContribSource;
}

interface KeyValProps {
  label: string;
  description?: any;
  children: string | undefined;
}

export interface PackageContribution {
  packageNameSource: string;
  packageVersionSource: string | undefined;
  packageName: string;
  packageVersion: string;
  packageVersionLatest: boolean;
  targetFramework: TargetFramework;
  comments?: string;
}

const PackageRuleContributionInternal: React.FC<Props> = ({ source }) => {
  const cachedTargetFramework = window.electron.getState("targetFramework");
  const history = useHistory() as MemoryHistory;
  const location = useLocation<HistoryState>();
  const nextPagePath = path.dirname(location.pathname);

  const [email, setEmail] = useState(window.electron.getState("email"));
  const [packageName, setPackageName] = useState("");
  const [packageVersion, setPackageVersion] = useState("");
  const [useLatestPackageVersion, setUseLatestPackageVersion] = useState(false);
  const [targetFramework, setTargetFramework] = useState(cachedTargetFramework);
  const [comments, setComments] = useState("");

  const onSelectTargetFramework = useCallback(([e]) => {
    setTargetFramework(e.detail.selectedOption);
    return e.detail.selectedOption;
  }, []);

  const onCancel = () => {
    history.goBack();
  };

  const onSubmit = async () => {
    const submission: PackageContribution = {
      packageNameSource: source.packageName,
      packageVersionSource: source.packageVersion,
      packageName: packageName,
      packageVersion: packageVersion,
      packageVersionLatest: useLatestPackageVersion,
      targetFramework: targetFramework,
      comments: comments
    };
    // TODO: Actually submit this for verification
    const result = await uploadRuleContribution(email, submission);
    console.log("Upload result: " + result);
    history.push(nextPagePath);
  };

  const ValueWithLabel: React.FC<KeyValProps> = ({ label, description, children }) => (
    <SpaceBetween size="xxs">
      <Box color="text-label">{label}</Box>
      <Box color="text-body-secondary" fontSize="body-s">
        {description}
      </Box>
      <div>{children}</div>
    </SpaceBetween>
  );

  const recommendationForm = (
    <Form
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSubmit}>
            Submit
          </Button>
        </SpaceBetween>
      }
    >
      <ColumnLayout columns={4}>
        <FormField label="Package name" description="Official name of the replacement package." stretch={true}>
          <Input
            value={packageName}
            onChange={({ detail }) => setPackageName(detail.value)}
            placeholder="Example.Package.Name"
          />
        </FormField>
        <FormField label="Package version" description='Provide a version number or check "Latest."' stretch={true}>
          <Input
            value={packageVersion}
            onChange={({ detail }) => setPackageVersion(detail.value)}
            disabled={useLatestPackageVersion}
            placeholder="1.0.0"
          />
          <Checkbox
            onChange={({ detail }) => {
              setUseLatestPackageVersion(detail.checked);
              if (detail.checked) {
                setPackageVersion("");
              }
            }}
            checked={useLatestPackageVersion}
          >
            Latest
          </Checkbox>
        </FormField>
        <FormField label="Target framework" description="Select the target framework." stretch={true}>
          <Select
            selectedOption={targetFramework}
            options={targetFrameworkOptions}
            onChange={onSelectTargetFramework}
          />
        </FormField>
        <FormField
          label={
            <span>
              Comments <i>- optional</i>
            </span>
          }
          description="Include any additonal information."
          stretch={true}
        >
          <Input value={comments} onChange={({ detail }) => setComments(detail.value)} />
        </FormField>
      </ColumnLayout>
    </Form>
  );

  return (
    <SpaceBetween size="l">
      <EnterEmailModal
        visible={!isEmailSet()}
        onSaveExit={() => {
          setEmail(window.electron.getState("email"));
        }}
      />
      <Container
        header={
          <Header variant="h2" description="Please confirm that your e-mail and NuGet package details are correct.">
            User and NuGet package details
          </Header>
        }
      >
        <ColumnLayout columns={3} variant="text-grid">
          <ValueWithLabel
            label="E-mail"
            description={
              <div>
                Your e-mail is used to contact you about your suggestion. To change it, please visit&nbsp;
                <Link
                  to={{
                    pathname: "/edit-settings"
                  }}
                >
                  Settings
                </Link>
                .
              </div>
            }
          >
            {email}
          </ValueWithLabel>
          <ValueWithLabel label="Selected package name">{source?.packageName}</ValueWithLabel>
          <ValueWithLabel label="Selected package version">{source?.packageVersion}</ValueWithLabel>
        </ColumnLayout>
      </Container>
      <Container
        header={
          <Header variant="h2" description="Please enter your replacement suggestion here.">
            Suggestion form
          </Header>
        }
      >
        <SpaceBetween size="l">{recommendationForm}</SpaceBetween>
      </Container>
    </SpaceBetween>
  );
};

export const PackageRuleContribution = React.memo(PackageRuleContributionInternal);
