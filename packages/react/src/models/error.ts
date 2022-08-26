import { FlashbarProps } from "@cloudscape-design/components";

export interface Message extends FlashbarProps.MessageDefinition {
  messageId: string;
  groupId?: string;
}
