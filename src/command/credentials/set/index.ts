import { Group } from "@project/ui";
import { CredentialsSetCodeArtifactAction } from "@project/command/credentials/set/codeartifact";
import { CredentialsSetStaticTokenAction } from "@project/command/credentials/set/static-token";

export const CredentialsSetGroup: Group = {
  type: "group",
  name: "set",
  description: "set user credentials",
  commands: [CredentialsSetCodeArtifactAction, CredentialsSetStaticTokenAction],
};
