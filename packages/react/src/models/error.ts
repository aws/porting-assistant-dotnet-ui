import { FlashbarProps } from "@awsui/components-react";

export interface Message extends FlashbarProps.MessageDefinition {
  messageId: string;
  groupId?: string;
}
