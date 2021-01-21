import "source-map-support/register";
import { asSubcommand } from "../ui";

asSubcommand(
  async (project, opts) => {
    project.credentials.credentials[opts.name] = {
      type: "aws",
      profile: opts.profile,
    };
    await project.credentials.flush();
  },
  (command) => {
    command
      .requiredOption("--name <name>", "credential name")
      .requiredOption("--profile <profile>", "profile name");
  }
);
