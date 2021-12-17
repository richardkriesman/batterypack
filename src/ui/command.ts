import * as Commander from "commander";

export type Action<P extends any[] = []> = {
  type: "action";
  name: string;
  description: string;
  run(...params: P): Promise<void> | void;
};

export const Action = {
  buildCommanderConfig(action: Action<any[]>): Commander.Command {
    return new Commander.Command(action.name)
      .description(action.description)
      .action(action.run);
  },
};

export type Group = {
  type: "group";
  name: string;
  description: string;
  commands: (Action<unknown[]> | Group)[];
};

export const Group = {
  buildCommanderConfig(root: Group): Commander.Command {
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
  },
};
