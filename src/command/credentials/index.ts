import { Group } from "@project/ui";
import { CredentialsListAction } from "@project/command/credentials/list";
import { CredentialsSetGroup } from "@project/command/credentials/set";

export const CredentialsGroup: Group = {
  type: "group",
  name: "credentials",
  description: "manage user credentials",
  commands: [CredentialsListAction, CredentialsSetGroup],
};
