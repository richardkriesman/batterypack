import "source-map-support/register";
import { asSubcommand } from "../ui";

asSubcommand(
  async (project, opts) => {
    project.credentials.credentials[opts.name] = {
      type: "codeartifact",
      profileName: opts.profile,
      domain: opts.domain,
      domainOwner: opts.domainOwner,
      region: opts.region,
    };
    await project.credentials.flush();
  },
  (command) => {
    command
      .requiredOption("--name <name>", "credential name")
      .requiredOption("--profile <profile>", "profile name")
      .requiredOption("--domain <domain>", "CodeArtifact domain")
      .requiredOption("--domain-owner <domain-owner>", "domain owner")
      .requiredOption("--region <region>", "AWS region");
  }
);
