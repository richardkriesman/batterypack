import { Action } from "@project/ui";
import { Project } from "@project/project";

export const CredentialsSetCodeArtifactAction: Action<{
  name: string;
  profile: string;
  domain: string;
  domainOwner: string;
  region: string;
}> = {
  type: "action",
  name: "codeartifact",
  description: "AWS CodeArtifact",
  flags: {
    name: {
      type: "string",
      description: "credential name",
      shortName: "n",
      required: true,
    },
    profile: {
      type: "string",
      description: "AWS profile name",
      required: true,
    },
    domain: {
      type: "string",
      description: "CodeArtifact domain",
      required: true,
    },
    domainOwner: {
      type: "string",
      description: "CodeArtifact domain owner",
      required: true,
    },
    region: {
      type: "string",
      description: "AWS region",
      required: true,
    },
  },
  async run(project: Project, flags): Promise<void> {
    project.credentials.credentials[flags.name!] = {
      type: "codeartifact",
      profileName: flags.profile!,
      domain: flags.domain!,
      domainOwner: flags.domainOwner!,
      region: flags.region!,
    };
    await project.credentials.flush();
  },
};
