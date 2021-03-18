import "source-map-support/register";
import Chalk from "chalk";
import * as Path from "path";

import { asSubcommand, formatTree } from "@project/ui";
import { Project } from "@project/project";
import { TreeNode } from "@project/types";
import { ProjectPaths } from "@project/paths";

asSubcommand(async (project: Project) => {
  const rootPath: string = await project.resolver.resolve(ProjectPaths.root);

  /**
   * Builds a subproject path tree for a project.
   */
  async function buildTree(
    project: Project,
    relativeTo?: string
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
    for (const subprojectPath of project.config.subprojects ?? []) {
      node.children.push(
        await buildTree(
          await Project.open(Path.resolve(Path.join(absPath, subprojectPath))),
          rootPath
        )
      );
    }

    return node;
  }

  // print resultant tree
  console.log(formatTree(await buildTree(project)));
});
