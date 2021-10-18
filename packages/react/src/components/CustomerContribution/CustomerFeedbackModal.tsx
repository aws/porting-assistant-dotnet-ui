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
} from "@awsui/components-react";
import React from "react";

import { sendCustomerFeedback } from "../../utils/sendCustomerFeedback";

interface Props {
  visible: boolean;
  setModalVisible: any;
  showEmailModal: any;
}

export interface CustomerFeedback {
  feedback: string;
  category: string;
  email: string;
  date: string;
}

export const CustomerFeedbackModal: React.FC<Props> = React.memo(({ visible, setModalVisible, showEmailModal }) => {
  const [inputValue, setInputValue] = React.useState("");
  const [categoryType, setCategory] = React.useState("");
  const [isCategoryEmpty, setIsCategoryEmpty] = React.useState(false);
  const [isValueEmpty, setIsValueEmpty] = React.useState(false);

  const emailValue = window.electron.getState("email");

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
              variant="primary"
              onClick={async () => {
                if (categoryType === "" || categoryType == null) {
                  setIsCategoryEmpty(true);
                }
                if (inputValue === "" || inputValue == null) {
                  setIsValueEmpty(true);
                }
                if (!(categoryType === "" || categoryType == null) && !(inputValue === "" || inputValue == null)) {
                  const cur_date = Date().toString();

                  const submission: CustomerFeedback = {
                    feedback: inputValue,
                    category: categoryType,
                    email: emailValue,
                    date: cur_date.replace(/[^a-zA-Z0-9]/g, "-")
                  };

                  const result = await sendCustomerFeedback(submission);
                  console.log("result: " + result);

                  setModalVisible(false);
                  setInputValue("");
                  setCategory("");
                  setIsCategoryEmpty(false);
                  setIsValueEmpty(false);
                }
              }}
            >
              Send
            </Button>
          </SpaceBetween>
        </Box>
      }
      header={<React.Fragment>Send feedback?</React.Fragment>}
    >
      <SpaceBetween size="s">
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

        <TextContent>
          <h5>All feedback will be sent to the .NET Porting Assistant team. </h5>
        </TextContent>

        <ButtonDropdown
          items={[
            { text: "General", id: "general" },
            { text: "Question", id: "question" },
            { text: "Error", id: "error" }
          ]}
          onItemClick={e => {
            setIsCategoryEmpty(false);
            if (e.detail.id === "general") {
              console.log("general");
              setCategory("general");
            } else if (e.detail.id === "question") {
              setCategory("question");
              console.log("question");
            } else {
              setCategory("error");
              console.log("error");
              //enter additional logic for searching for any errors on screen to send to team
            }
          }}
        >
          Feedback Category
        </ButtonDropdown>

        <FormField>
          <Input
            value={inputValue}
            onChange={event => {
              setInputValue(event.detail.value);
              setIsValueEmpty(false);
            }}
            placeholder="Enter feedback"
          />
        </FormField>
      </SpaceBetween>
      Email linked with this feedback is: {emailValue}
      <Button variant="link" onClick={() => showEmailModal()}>
        Edit
      </Button>
    </Modal>
  );
});
