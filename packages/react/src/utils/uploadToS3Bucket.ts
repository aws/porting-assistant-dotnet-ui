import { PackageContribution } from "../components/Feedback/PackageRuleContribution";

export interface RuleContribution {
  email: string;
  contribution: PackageContribution;
}

export const uploadRuleContribution = async (email: string, contribution: PackageContribution) => {
  const submission: RuleContribution = {
    email: email,
    contribution: contribution
  };
  const upload = {
    keyName: contribution.packageName + ".json",
    contents: JSON.stringify(submission, null, 4)
  };
  const uploadSuccess: boolean = await window.backend.uploadRuleContribution(upload);

  return uploadSuccess;
};
