import { ReactNode } from "react";

export interface LearnMoreLinks {
  externalUrl: string;
  text: string;
}

export interface HelpInfo {
  heading: string;
  mainContent: ReactNode;
  learnMoreLinks: LearnMoreLinks[];
}
