import * as Commander from "commander";

import { Action } from "@project/ui/action";
import { FlagParams } from "@project/ui/flag";

export type Group = {
  type: "group";
  name: string;
  description: string;
  commands: (Action<FlagParams> | Group)[];
};

function buildCommanderConfig(root: Group): Commander.Command {
  const cmd = new Commander.Command(root.name).description(root.description);
  for (const command of root.commands) {
    switch (command.type) {
      case "action":
        cmd.addCommand(Action.buildCommanderConfig(command));
        break;
      case "group":
        cmd.addCommand(Group.buildCommanderConfig(command));
        break;
    }
  }
  return cmd;
}

export const Group = {
  buildCommanderConfig,
} as const;
