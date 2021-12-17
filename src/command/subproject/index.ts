import { Group } from "@project/ui";
import { SubprojectTreeAction } from "@project/command/subproject/tree";

export const SubprojectGroup: Group = {
  type: "group",
  name: "subproject",
  description: "manage subprojects",
  commands: [SubprojectTreeAction],
};
