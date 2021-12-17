import { Project } from "@project/project";
import { Action, Graphic } from "@project/ui";

export const CredentialsListAction: Action<{}> = {
  type: "action",
  name: "list",
  description: "list user credentials",
  flags: {},
  run(project: Project): void {
    console.log(
      Graphic.table({
        headers: ["Name", "Type"],
        data: Object.keys(project.credentials.credentials).map((key) => {
          return [key, project.credentials.credentials[key].type];
        }),
      })
    );
  },
};
