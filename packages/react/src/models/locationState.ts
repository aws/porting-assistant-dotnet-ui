import { RuleContribSource } from "../containers/RuleContribution";

export interface HistoryState {
  activeTabId?: string;
  activePage?: number;
  activeFilter?: string;
  ruleContribSourceInfo?: RuleContribSource;
}
