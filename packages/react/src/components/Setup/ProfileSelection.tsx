import {
  Box,
  Button,
  Checkbox,
  ColumnLayout,
  Container,
  Form,
  FormField,
  Header,
  Link,
  Select,
  SelectProps,
  Spinner
} from "@awsui/components-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router";

import { externalUrls } from "../../constants/externalUrls";
import { init, setProfileSet } from "../../store/actions/backend";
import { getSupportedVersion } from "../../utils/getSupportedVersions";
import { InfoLink } from "../InfoLink";
import styles from "./ProfileSelection.module.scss";

interface Props {
  title: string;
  buttonText: string;
  next?: () => void;
}

type FormData = {
  profileSelection: string;
  targetFrameworkSelection: SelectProps.Option;
  share: boolean;
  email: string;
  useDefaultCreds: boolean;
  removeProfile: boolean;
};

const ProfileSelectionInternal: React.FC<Props> = ({ title, next, buttonText }) => {
  const { control, errors, handleSubmit, setError, formState } = useForm<FormData>();
  const history = useHistory();
  const { isSubmitting } = formState;
  const dispatch = useDispatch();
  const currentProfile = window.electron.getState("profile");
  const cachedUseDefaultCreds = window.electron.getState("useDefaultCreds");

  const cachedTargetFramework = window.electron.getState("targetFramework");
  const [defaultTargetFramework, setDefaultFramework] = useState({label: "", value: ""} as SelectProps.Option);
  const [targetFramework, setTargetFramework] = useState(defaultTargetFramework);
  const [targetFrameworkOptions, setFrameworkOptions] = useState(new Array<SelectProps.Option>());

  useEffect(() => {
    (async () => {
      var currentOptions = await getSupportedVersion();
      setFrameworkOptions(currentOptions);

      // Need to convert from existing user selection to latest options if name changes.
      var lookupOption = currentOptions.find((item) => {
        return item.value === cachedTargetFramework.id;
      });

      var currentOption = {label: lookupOption?.label, value: lookupOption?.value} as SelectProps.Option;
      setTargetFramework(currentOption);
      setDefaultFramework(currentOption);
    })();
  }, []);

  const actionButton = useMemo(
    () => (
      <div>
        {isSubmitting && <Spinner />}
        <Button variant="link" formAction="none" onClick={() => history.goBack()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button id="next-btn" variant="primary" formAction="submit" disabled={isSubmitting}>
          {buttonText}
        </Button>
      </div>
    ),
    [buttonText, history, isSubmitting]
  );

  const onSelectTargetFramework = useCallback(([e]) => {
    setTargetFramework(e.detail.selectedOption);
    return e.detail.selectedOption;
  }, []);

  const onCheckbox = useCallback(([e]) => {
    return e.detail.checked;
  }, []);

  const onRemoveProfile = useCallback(([e]) => {
    return e.detail.checked;
  }, []);

  return (
    <div>
      <form
        onSubmit={handleSubmit(async data => {
          if (targetFramework.value == null || targetFramework.value.trim() == "" ||
              targetFramework.label == null || targetFramework.label.trim() == "") {
              setError("targetFrameworkSelection", "required", "Target Framework is required.");
              return;
            }
            window.electron.saveState("lastConfirmVersion", "1.3.0");
            window.electron.saveState("share", data.share);
            window.electron.saveState("targetFramework", {
              id: targetFramework.value,
              label: targetFramework.label
            });
            // Wait for C# backend to restart
            await new Promise(resolve => setTimeout(resolve, 10000));
            dispatch(init(true));
            dispatch(setProfileSet(true));
            // set pending message and go back to settings dashboard
            next && next();
        })}
      >
        <Form
          header={
            <Header
              variant="h1"
              info={
                <InfoLink
                  heading={title}
                  mainContent={
                    currentProfile ? (
                      <p>
                        When you start the assessment tool for the first time, you are prompted to enter your AWS CLI
                        profile information so that Porting Assistant for .NET can collect metrics to improve your
                        experience. These metrics also help flag issues with the software for AWS to quickly address. If
                        you have not set up your AWS CLI profile, see Configuring the AWS CLI below.
                      </p>
                    ) : (
                      ""
                    )
                  }
                  learnMoreLinks={
                    currentProfile
                      ? [
                          {
                            text: "Configuring the AWS CLI",
                            externalUrl:
                              "https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html#cli-quick-configuration"
                          }
                        ]
                      : []
                  }
                />
              }
            >
              {title}
            </Header>
          }
          actions={actionButton}
        >
          <Container header={<Header variant="h2">Porting Assistant for .NET settings</Header>}>
            <ColumnLayout>
              <div>
                <Box fontSize="body-m">Target framework</Box>
                <Box
                  fontSize="body-s"
                  margin={{
                    right: "xxs"
                  }}
                  color="text-body-secondary"
                >
                  Select a target framework to allow Porting Assistant for .NET to assess your solution for .NET Core
                  compatibility.
                  <Link
                    external
                    href="#/"
                    fontSize="body-s"
                    onFollow={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      window.electron.openExternalUrl(externalUrls.dotnetSupportPolicy);
                    }}>Learn more</Link>
                </Box>
                <div className={styles.select}>
                  <FormField id="targetFramework-selection" errorText={errors.targetFrameworkSelection?.message}>
                    <Controller
                      as={Select}
                      options={targetFrameworkOptions}
                      selectedOption={targetFramework}
                      control={control}
                      onChange={onSelectTargetFramework}
                      name="targetFrameworkSelection"
                      rules={{
                        required: "Target Framework is required"
                      }}
                      defaultValue={defaultTargetFramework}
                    />
                  </FormField>
                </div>
              </div>
              {cachedUseDefaultCreds || currentProfile ? (
                <div>
                  <div>
                    <Box fontSize="body-m">Porting Assistant for .NET data usage sharing</Box>
                    {/* #7f7f7f */}
                    <Box fontSize="body-s" color="text-body-secondary">
                      When you share your usage data, Porting Assistant for .NET will collect information only about the
                      public NuGet packages, APIs, build errors and stack traces. This information is used to make the
                      Porting Assistant for .NET product better, for example, to improve the package and API replacement
                      recommendations. Porting Assistant for .NET does not collect any identifying information about
                      you.{" "}
                      <Link
                        external
                        href="#/"
                        fontSize="body-s"
                        onFollow={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          window.electron.openExternalUrl(externalUrls.howItWorks);
                        }}
                      >
                        Learn more
                      </Link>
                    </Box>
                  </div>
                  <FormField>
                    <Controller
                      as={shareCheckbox}
                      name="share"
                      control={control}
                      onChange={onCheckbox}
                      defaultValue={true}
                    />
                  </FormField>
                  <br></br>
                  <Box>Current Profile: {currentProfile}</Box>
                  <FormField>
                    <Controller
                      as={removeProfileCheckbox}
                      name="removeProfile"
                      control={control}
                      onChange={onRemoveProfile}
                      defaultValue={false}
                    />
                  </FormField>
                </div>
              ) : null}
            </ColumnLayout>
          </Container>
        </Form>
      </form>
    </div>
  );
};

const shareCheckbox = (
  <Checkbox checked={false}>
    <Box variant="div">
      I agree to share my usage data with Porting Assistant for .NET - <i>optional</i>
      <Box variant="div" fontSize="body-s" color="text-body-secondary">
        You can change this setting at any time on the Porting Assistant for .NET Settings page.
      </Box>
    </Box>
  </Checkbox>
);

const removeProfileCheckbox = (
  <Checkbox checked={false}>
    <Box variant="div">
      You no longer need to provide your named profile information to use Porting Assistant for .NET. Check the box to
      remove your profile information from Porting Assistant
    </Box>
  </Checkbox>
);

export const ProfileSelection = React.memo(ProfileSelectionInternal);
