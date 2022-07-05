import { CustomerFeedback } from "../components/CustomerContribution/CustomerFeedbackModal";

export const sendCustomerFeedback = async (customerfeedback: CustomerFeedback) => {
  const upload = {
    feedback: customerfeedback.feedback,
    category: customerfeedback.category,
    date: customerfeedback.date,
    email: customerfeedback.email,
    timestamp: customerfeedback.date
  };
  const response = await window.backend.sendCustomerFeedback(upload);
  return response;
};
