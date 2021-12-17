import { Action } from "@project/ui";
import { Project } from "@project/project";

export const CredentialsSetStaticTokenAction: Action<{
  name: string;
  token: string;
}> = {
  type: "action",
  name: "static-token",
  description: "static token",
  flags: {
    name: {
      type: "string",
      description: "credential name",
      shortName: "n",
      required: true,
    },
    token: {
      type: "string",
      description: "static token",
      required: true,
    },
  },
  async run(project: Project, flags): Promise<void> {
    project.credentials.credentials[flags.name!] = {
      type: "static-token",
      token: flags.token!,
    };
    await project.credentials.flush();
  },
};
