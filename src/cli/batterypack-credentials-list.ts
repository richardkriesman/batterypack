import "source-map-support/register";

import { asSubcommand, printTable } from "@project/ui";
import { Project } from "@project/project";

asSubcommand(async (project: Project) => {
  printTable({
    headers: ["Name", "Type"],
    data: Object.keys(project.credentials.credentials).map((key) => {
      return [key, project.credentials.credentials[key].type];
    }),
  });
});
