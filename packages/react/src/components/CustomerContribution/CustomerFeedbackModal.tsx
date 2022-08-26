import {
  Alert,
  Box,
  Button,
  ButtonDropdown,
  FormField,
  Input,
  Modal,
  SpaceBetween,
  TextContent
} from "@cloudscape-design/components";
import React from "react";

import { externalUrls } from "../../constants/externalUrls";

interface Props {
  visible: boolean;
  setModalVisible: any;
}

export const CustomerFeedbackModal: React.FC<Props> = React.memo(({ visible, setModalVisible }) => {
  const [inputValue, setInputValue] = React.useState("");
  const [categoryType, setCategory] = React.useState("Feedback Category");
  const [isCategoryEmpty, setIsCategoryEmpty] = React.useState(false);
  const [isValueEmpty, setIsValueEmpty] = React.useState(false);

  return (
    <Modal
      onDismiss={() => setModalVisible(false)}
      visible={visible}
      closeAriaLabel="Close modal"
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button
              id="send-feedback-btn"
              variant="primary"
              onClick={async () => {
                if (categoryType === "Feedback Category" || categoryType == null) {
                  setIsCategoryEmpty(true);
                }
                if (inputValue === "" || inputValue == null) {
                  setIsValueEmpty(true);
                }
                if (
                  !(categoryType === "Feedback Category" || categoryType == null) &&
                  !(inputValue === "" || inputValue == null)
                ) {
                  window.location.href = `mailto:${externalUrls.email}?subject=${categoryType} - Porting Assistant for .NET&body=${inputValue}`;

                  setModalVisible(false);
                  setInputValue("");
                  setCategory("Feedback Category");
                  setIsCategoryEmpty(false);
                  setIsValueEmpty(false);
                }
              }}
            >
              Send Email
            </Button>
          </SpaceBetween>
        </Box>
      }
      header={<React.Fragment>Send feedback?</React.Fragment>}
    >
      <SpaceBetween size="xs">
        <Alert
          onDismiss={() => setIsValueEmpty(false)}
          visible={isValueEmpty}
          dismissAriaLabel="Close alert"
          header="No Feedback Entered"
        >
          Please enter in non-empty feedback.
        </Alert>
        <Alert
          onDismiss={() => setIsCategoryEmpty(false)}
          visible={isCategoryEmpty}
          dismissAriaLabel="Close alert"
          header="Feedback Category Not Selected"
        >
          Please select a category for your feedback.
        </Alert>

        <TextContent>All feedback will be sent to the .NET Porting Assistant team via email.</TextContent>

        <ButtonDropdown
          id="fb-category-selection"
          items={[
            {
              text: "General",
              id: "general"
            },
            {
              text: "Question",
              id: "question"
            },
            {
              text: "Error",
              id: "error"
            }
          ]}
          onItemClick={e => {
            setIsCategoryEmpty(false);
            if (e.detail.id === "general") {
              setCategory("General");
            } else if (e.detail.id === "question") {
              setCategory("Question");
            } else {
              setCategory("Error");
              //enter additional logic for searching for any errors on screen to send to team
            }
          }}
        >
          {categoryType}
        </ButtonDropdown>

        <FormField id="fb-text">
          <Input
            value={inputValue}
            onChange={event => {
              setInputValue(event.detail.value);
              setIsValueEmpty(false);
            }}
            placeholder="Enter feedback"
          />
        </FormField>
        {categoryType === "Error" ? (
          <TextContent>
            To help us investigate the issue, please include the logs located here: {window.electron.getLogFolder()}
          </TextContent>
        ) : null}
      </SpaceBetween>
      <br />
    </Modal>
  );
});
