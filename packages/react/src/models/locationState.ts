import { RuleContribSource } from "../containers/RuleContribution";

export interface HistoryState {
  activeTabId?: string;
  activePage?: number;
  ruleContribSourceInfo?: RuleContribSource;
}
