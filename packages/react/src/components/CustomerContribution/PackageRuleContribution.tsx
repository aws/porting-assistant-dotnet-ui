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
  Multiselect,
  SpaceBetween
} from "@awsui/components-react";
import { OptionDefinition } from "@awsui/components-react/internal/components/option/interfaces";
import { MemoryHistory } from "history";
import path from "path";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router";
import { useHistory } from "react-router-dom";
import { v4 as uuid } from "uuid";

import { externalUrls } from "../../constants/externalUrls";
import { RuleContribSource } from "../../containers/RuleContribution";
import { HistoryState } from "../../models/locationState";
import { pushCurrentMessageUpdate } from "../../store/actions/error";
import { validatePackageInput } from "../../utils/validateRuleContrib";
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
  targetFramework: readonly OptionDefinition[];
  comments?: string;
}

const PackageRuleContributionInternal: React.FC<Props> = ({ source }) => {
  const cachedTargetFramework = window.electron.getState("targetFramework");
  const history = useHistory() as MemoryHistory;
  const location = useLocation<HistoryState>();
  const nextPagePath = path.dirname(location.pathname);
  const dispatch = useDispatch();

  const [packageName, setPackageName] = useState("");
  const [packageVersion, setPackageVersion] = useState("");
  const [packageError, setPackageError] = useState("");
  const [versionError, setVersionError] = useState("");
  const [targetFrameworkError, setTargetFrameworkError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [useLatestPackageVersion, setUseLatestPackageVersion] = useState(false);
  const [targetFramework, setTargetFramework] = useState<readonly OptionDefinition[]>([
    {
      label: cachedTargetFramework.label,
      value: cachedTargetFramework.id
    }
  ]);
  const [comments, setComments] = useState("");

  const onCancel = () => {
    history.goBack();
  };

  const setFlashbar = useCallback(
    messageContent => {
      dispatch(pushCurrentMessageUpdate(messageContent));
    },
    [dispatch]
  );

  const onSubmit = async () => {
    setSubmitLoading(true);
    setPackageError("");
    setVersionError("");
    setTargetFrameworkError("");
    const submission: PackageContribution = {
      packageNameSource: source.packageName,
      packageVersionSource: source.packageVersion,
      packageName: packageName,
      packageVersion: packageVersion,
      packageVersionLatest: useLatestPackageVersion,
      targetFramework: targetFramework,
      comments: comments
    };

    if (await validateInput(submission)) {
      const formattedSubmission = formatPackageContribution(submission);
      var content = JSON.stringify(formattedSubmission, null, 4)
        .split("\n")
        .join("%0D%0A");
      window.location.href = `mailto:${externalUrls.email}?subject=Rule Contribution - Porting Assistant for .NET&body=${content}`;
      history.push(nextPagePath);
    } else {
      setSubmitLoading(false);
    }
  };

  const validateInput = async (submission: PackageContribution) => {
    //Error handling for API call
    try {
      // result is type ValidationResult:
      // {valid: boolean, field?: string, message?: string}
      const result = await validatePackageInput(submission);
      if (!result.valid) {
        switch (result.field) {
          case "packageName":
            if (result.message) setPackageError(result.message);
            break;
          case "packageVersion":
            if (result.message) setVersionError(result.message);
            break;
          case "targetFramework":
            if (result.message) setTargetFrameworkError(result.message);
            break;
          case "packageName/packageVersion":
            if (result.message) {
              setPackageError(result.message);
              setVersionError(result.message);
            }
            break;
          default:
            break;
        }
        return false;
      }
    } catch {
      // Shows an error flashbar at the top
      setFlashbar({
        messageId: uuid(),
        type: "error",
        content: "Unable to reach the server to verify the provided package. Please try again.",
        dismissible: true
      });
      return false;
    }
    return true;
  };

  const formatPackageContribution = (submission: PackageContribution) => {
    return {
      Name: submission.packageNameSource,
      Version: submission.packageVersionSource,
      Packages: [
        {
          Name: submission.packageNameSource,
          Type: "Nuget"
        }
      ],
      Recommendations: [
        {
          Type: "Namespace",
          Name: submission.packageNameSource,
          Value: submission.packageNameSource,
          KeyType: "Name",
          ContainingType: "",
          RecommendedActions: [
            {
              Source: "External",
              Preferred: "Yes",
              TargetFrameworks: submission.targetFramework.map(t => ({
                Name: t.value,
                TargetCPU: ["x86", "x64", "ARM32", "ARM64"]
              })),
              Description: "",
              Actions: submission.packageVersionLatest
                ? [
                    {
                      Name: "AddPackage",
                      Type: "Package",
                      Value: submission.packageName,
                      Description: submission.comments
                    }
                  ]
                : [
                    {
                      Name: "AddPackage",
                      Type: "Package",
                      Value: submission.packageName,
                      Version: submission.packageVersion,
                      Description: submission.comments
                    }
                  ]
            }
          ]
        }
      ]
    };
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
          <Button id="rc-send-btn" loading={submitLoading} variant="primary" onClick={onSubmit}>
            Send Email
          </Button>
        </SpaceBetween>
      }
    >
      <ColumnLayout columns={4}>
        <FormField
          id="rc-package-name"
          label="Package name"
          description="Official name of the replacement package."
          stretch={true}
          errorText={packageError}
        >
          <Input
            value={packageName}
            onChange={({ detail }) => setPackageName(detail.value.trim())}
            placeholder="Example.Package.Name"
          />
        </FormField>
        <FormField
          label="Package version"
          description='Provide a version number or check "Latest."'
          stretch={true}
          errorText={versionError}
        >
          <Input
            value={packageVersion}
            onChange={({ detail }) => setPackageVersion(detail.value)}
            disabled={useLatestPackageVersion}
            placeholder="1.0.0"
          />
          <Checkbox
            id="rc-version-check-box"
            onChange={({ detail }) => {
              setUseLatestPackageVersion(detail.checked);
              if (detail.checked) {
                setPackageVersion("");
                setVersionError("");
              }
            }}
            checked={useLatestPackageVersion}
          >
            Latest
          </Checkbox>
        </FormField>
        <FormField
          label="Target framework"
          description="Select the target frameworks."
          errorText={targetFrameworkError}
          stretch={true}
        >
          <Multiselect
            selectedOptions={targetFramework}
            options={targetFrameworkOptions}
            onChange={({ detail }) => setTargetFramework(detail.selectedOptions)}
          />
        </FormField>
        <FormField
          id="rc-comment"
          label={<span>Comments</span>}
          description="Please provide a short description."
          stretch={true}
        >
          <Input value={comments} onChange={({ detail }) => setComments(detail.value)} />
        </FormField>
      </ColumnLayout>
    </Form>
  );

  return (
    <SpaceBetween size="l">
      <Container
        header={
          <Header variant="h2" description="Please confirm that your NuGet package details are correct. ">
            NuGet package details
          </Header>
        }
      >
        <ColumnLayout columns={3} variant="text-grid">
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
