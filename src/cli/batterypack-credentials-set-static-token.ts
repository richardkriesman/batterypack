import "source-map-support/register";

import { asSubcommand } from "@project/ui";

asSubcommand(
  async (project, opts) => {
    project.credentials.credentials[opts.name] = {
      type: "static-token",
      token: opts.token,
    };
    await project.credentials.flush();
  },
  (command) => {
    command
      .requiredOption("--name <name>", "credential name")
      .requiredOption("--token <token>", "static token");
  }
);
