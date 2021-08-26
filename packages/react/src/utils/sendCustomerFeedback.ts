import { CustomerFeedback } from "../components/AssessSolution/AssessSolutionDashboard";

export const sendCustomerFeedback = async (customerfeedback: CustomerFeedback) => {
  const upload = {
    feedback: customerfeedback.feedback,
    category: customerfeedback.category,
    date: customerfeedback.date,
    email: customerfeedback.email,
    timestamp: customerfeedback.date
  };

  const sentFeedback: boolean = await window.backend.sendCustomerFeedback(upload);

  return sentFeedback;
};
