import Chalk from "chalk";
import * as Path from "path";

import { Project } from "@project/project";
import { ProjectPaths } from "@project/paths";
import { Action, Graphic, TreeNode } from "@project/ui";

const DEFAULT_MAX_DEPTH: number = 1;

export const SubprojectTreeAction: Action<{
  maxDepth: string;
}> = {
  type: "action",
  name: "tree",
  description: "show the subproject dependency tree",
  flags: {
    maxDepth: {
      type: "string",
      description: `maximum tree depth (default ${DEFAULT_MAX_DEPTH})`,
      shortName: "d",
    },
  },
  async run(project, flags): Promise<void> {
    const rootPath: string = await project.resolver.resolve(ProjectPaths.root);
    const maxDepth: number =
      flags.maxDepth && Number(flags.maxDepth)
        ? Number(flags.maxDepth)
        : DEFAULT_MAX_DEPTH;

    /**
     * Builds a subproject path tree for a project.
     */
    async function buildTree(
      project: Project,
      relativeTo?: string,
      depth: number = 0
    ): Promise<TreeNode<string>> {
      // determine path name
      const absPath: string = await project.resolver.resolve(ProjectPaths.root);
      const relPath: string =
        relativeTo !== undefined ? Path.relative(relativeTo, absPath) : absPath;

      // build node
      const node: TreeNode<string> = {
        value: `${project.config.name ?? "Unnamed project"} ${Chalk.grey(
          `(${relPath})`
        )}`,
        children: [],
      };

      // recursively build subtrees for subprojects
      if (depth < maxDepth) {
        for (const subprojectPath of project.config.subprojects ?? []) {
          node.children.push(
            await buildTree(
              await Project.open(
                Path.resolve(Path.join(absPath, subprojectPath))
              ),
              rootPath,
              depth + 1
            )
          );
        }
      }

      return node;
    }

    // print resultant tree
    console.log(Graphic.tree(await buildTree(project)));
  },
};
