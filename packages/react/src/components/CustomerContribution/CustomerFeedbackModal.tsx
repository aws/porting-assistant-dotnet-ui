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
import { useDispatch } from "react-redux";
import { v4 as uuid } from "uuid";

import { pushCurrentMessageUpdate } from "../../store/actions/error";
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
  const [categoryType, setCategory] = React.useState("Feedback Category");
  const [isCategoryEmpty, setIsCategoryEmpty] = React.useState(false);
  const [isValueEmpty, setIsValueEmpty] = React.useState(false);
  const dispatch = useDispatch();

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
              id = "send-feedback-btn"
              variant="primary"
              onClick={async () => {
                if (categoryType === "Feedback Category" || categoryType == null) {
                  setIsCategoryEmpty(true);
                }
                if (inputValue === "" || inputValue == null) {
                  setIsValueEmpty(true);
                }
                if (!(categoryType === "Feedback Category" || categoryType == null) && !(inputValue === "" || inputValue == null)) {
                  const cur_date = new Date();
                  let date_str = cur_date.toISOString();

                  const submission: CustomerFeedback = {
                    feedback: inputValue,
                    category: categoryType,
                    email: emailValue,
                    date: date_str.replace(/[^a-zA-Z0-9]/g, "-")
                  };

                  const response = await sendCustomerFeedback(submission);
                  if (response.status.status === "Success") {
                    dispatch(
                      pushCurrentMessageUpdate({
                        messageId: uuid(),
                        groupId: "customerFeedback",
                        content: `Successfully sent your feedback.`,
                        type: "success",
                        dismissible: true
                      })
                    );
                  } else {
                    window.electron.writeReactErrLog("CustomerFeedbackModal", "Failed to send customer feedback - PA UI", response.errorValue)
                    dispatch(
                      pushCurrentMessageUpdate({
                        messageId: uuid(),
                        groupId: "customerFeedbackFailed",
                        type: "error",
                        content: `Failed to send your feedback. If this error persists, contact support in the Porting Assistant help menu.`,
                        dismissible: true
                      })
                    );
                  }

                  setModalVisible(false);
                  setInputValue("");
                  setCategory("Feedback Category");
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

        <TextContent>All feedback will be sent to the .NET Porting Assistant team.</TextContent>

        <ButtonDropdown
          id = "fb-category-selection"
          items={[
            { text: "General", id: "general" },
            { text: "Question", id: "question" },
            { text: "Error", id: "error" }
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

        <FormField id = "fb-text">
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
      E-mail linked with this feedback is: {emailValue}
      <Button iconName="settings" variant="icon" onClick={() => showEmailModal()} />
      <br/>
      By clicking send you consent to sending your e-mail to the .NET Porting Assistant team. 
    </Modal>
  );
});
