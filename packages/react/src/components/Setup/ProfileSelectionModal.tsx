import { Box, Button, ColumnLayout, FormField, Input, Link, Modal, Textarea } from "@cloudscape-design/components";
import React from "react";
import { Controller, useForm } from "react-hook-form";

import { Credentials } from "../../models/setup";

type FormData = {
  profileName: string;
  accessKeyID: string;
  secretAccessKey: string;
  sessionToken: string;
};

interface Props {
  onAddProfile: (profileName: string) => void;
  onSetModalVisibility: (visible: boolean) => void;
  showModal: boolean;
}

const ProfileSelectionModalInternal: React.FC<Props> = ({ onAddProfile, onSetModalVisibility, showModal }) => {
  const { control, errors, reset, handleSubmit, getValues } = useForm<FormData>();

  const onSubmit = handleSubmit(data => {
    const { profileName, accessKeyID, secretAccessKey, sessionToken } = data;
    const credentials: Credentials = {
      aws_access_key_id: accessKeyID,
      aws_secret_access_key: secretAccessKey,
      aws_session_token: sessionToken
    };
    window.electron.writeProfile(profileName, credentials);
    onAddProfile(profileName);
    onSetModalVisibility(false);
    reset();
  });

  return (
    <div>
      <Modal
        visible={showModal}
        header="Add a named profile"
        footer={
          <Box variant="span" float="right">
            <Button
              variant="link"
              onClick={() => {
                onSetModalVisibility(false);
                reset();
              }}
              formAction="none"
            >
              Cancel
            </Button>
            <Button id="add-profile-button" variant="primary" formAction="submit" onClick={() => onSubmit()}>
              Add
            </Button>
          </Box>
        }
        onDismiss={() => {
          onSetModalVisibility(false);
          reset();
        }}
      >
        <ColumnLayout>
          <Box fontSize="body-m">
            A named profile is a collection of settings and credentials that you can apply to an AWS CLI command. Adding
            a named profile allows Porting Assistant for .NET to access your solution for .NET Core compatibility.
            Specify the following information to add a profile or use the AWS CLI.{" "}
            <Link
              external
              fontSize="body-m"
              href="#/"
              onFollow={event => {
                event.preventDefault();
                event.stopPropagation();
                window.electron.openExternalUrl(
                  "https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html#cli-quick-configuration"
                );
              }}
            >
              Learn more
            </Link>
          </Box>
          <FormField id="profile-name" label="Profile name" errorText={errors.profileName?.message}>
            <Controller
              as={Input}
              name="profileName"
              control={control}
              onChange={([e]) => e.detail.value}
              rules={{ required: "Profile is required" }}
              placeholder="Please enter profile name"
              value={getValues().profileName}
            />
          </FormField>
          <FormField id="access-key" label="AWS access key ID" errorText={errors.accessKeyID?.message}>
            <Controller
              as={Input}
              name="accessKeyID"
              control={control}
              onChange={([e]) => e.detail.value}
              rules={{
                required: "AWS access key ID is required",
                pattern: { value: new RegExp("^AKIA|^ASIA"), message: "AWS access key is invalid" }
              }}
              placeholder="Please enter AWS access key ID"
              value={getValues().accessKeyID}
            />
          </FormField>
          <FormField id="access-secret-key" label="AWS secret access key" errorText={errors.secretAccessKey?.message}>
            <Controller
              as={Input}
              name="secretAccessKey"
              control={control}
              onChange={([e]) => e.detail.value}
              rules={{ required: "AWS secret access key is required" }}
              placeholder="Please enter AWS secret access key"
              value={getValues().secretAccessKey}
            />
          </FormField>
          <FormField
            id="session-token"
            label={
              <span>
                AWS session token <i>- optional</i>
              </span>
            }
          >
            <Controller
              as={Textarea}
              name="sessionToken"
              rows={5}
              control={control}
              onChange={([e]) => e.detail.value}
              placeholder="Please enter AWS session token"
              value={getValues().sessionToken}
            />
          </FormField>
        </ColumnLayout>
      </Modal>
    </div>
  );
};

export const ProfileSelectionModal = React.memo(ProfileSelectionModalInternal);
