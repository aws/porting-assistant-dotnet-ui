import { CustomerFeedback } from "../components/AssessSolution/AssessSolutionDashboard";

export const sendCustomerFeedback = async (customerfeedback: CustomerFeedback) => {
  const upload = {
    keyname: "overwrite.json",
    contents: JSON.stringify(customerfeedback, null, 4),
    timestamp: customerfeedback.date
  };
  const sentFeedback: boolean = await window.backend.sendCustomerFeedback(upload);

  return sentFeedback;
};
