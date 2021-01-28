import "source-map-support/register";
import { asSubcommand, printTable } from "../ui";

asSubcommand(async (project) => {
  printTable({
    headers: ["Name", "Type"],
    data: Object.keys(project.credentials.credentials).map((key) => {
      return [key, project.credentials.credentials[key].type];
    }),
  });
});
