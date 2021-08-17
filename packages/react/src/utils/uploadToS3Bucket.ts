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
    keyName: keyName.toLowerCase() + ".json",
    contents: JSON.stringify(submission, null, 4)
  };
  const uploadSuccess: boolean = await window.backend.uploadRuleContribution(upload);

  return uploadSuccess;
};
