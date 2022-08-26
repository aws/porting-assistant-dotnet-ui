import { Box, Button, FormField, Input, Modal, SpaceBetween } from "@cloudscape-design/components";
import React from "react";

interface Props {
  visible: boolean;
  onCancel: any;
  onSaveExit: any;
}

// This function simply checks if the email is currently set
// It is designed to be used when implementing the EnterEmailModal
// However, it does not have to be used if the implementer
// wants to use their own functionality
// Use it to determine whether or not to display the modal
export const isEmailSet = () => {
  const email = window.electron.getState("email");
  if (email === "" || email == null) {
    return false;
  }
  return true;
};

export const EnterEmailModal: React.FC<Props> = React.memo(({ visible, onCancel, onSaveExit }) => {
  const [emailValue, setEmailValue] = React.useState("");
  const [emailError, setEmailError] = React.useState("");

  // Used to check if the email string is valid, e.g. example@amazon.com
  const validEmail = new RegExp(`^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$`);

  const saveAndClose = () => {
    // Validate
    if (validEmail.test(emailValue)) {
      // email is valid, save
      window.electron.saveState("email", emailValue);
      setEmailValue("");
      setEmailError("");
      onSaveExit();
    } else {
      // invalid email
      setEmailError("Invalid e-mail format.");
    }
  };

  const close = () => {
    setEmailValue("");
    setEmailError("");
    onCancel();
  };

  return (
    <Modal
      onDismiss={() => close()}
      visible={visible}
      closeAriaLabel="Close modal"
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => close()}>
              Cancel
            </Button>
            <Button id="email-btn" variant="primary" onClick={() => saveAndClose()}>
              Save
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="E-mail required"
    >
      <SpaceBetween direction="vertical" size="m">
        <Box>We require your e-mail to use this feature. Please enter your e-mail below.</Box>
        <FormField
          id="email-form"
          label="E-mail"
          description="We use this to contact you regarding any feedback or contributions to Porting Assistant."
          errorText={emailError}
        >
          <Input
            id="email-input"
            onChange={({ detail }) => setEmailValue(detail.value)}
            value={emailValue}
            placeholder="example@amazon.com"
          />
        </FormField>
        <Box>This action saves your e-mail locally on your machine.</Box>
      </SpaceBetween>
    </Modal>
  );
});
