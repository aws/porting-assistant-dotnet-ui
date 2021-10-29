export interface RuleContribution {
  email: string;
  contribution: any;
}

export const uploadRuleContribution = async (email: string, contribution: any, keyName: string) => {
  const submission: RuleContribution = {
    email: email,
    contribution: contribution
  };
  const upload = {
    KeyName: keyName.toLowerCase() + ".json",
    Contents: JSON.stringify(submission, null, 4)
  };
  const uploadSuccess = await window.backend.uploadRuleContribution(upload);

  return uploadSuccess;
};
