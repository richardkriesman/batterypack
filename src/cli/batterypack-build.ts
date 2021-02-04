import "source-map-support/register";
import Chalk from "chalk";
import { CompilationUnit, Compiler, CompilerErrorSet } from "../tool/compiler";
import { asSubcommandTaskTree, Task } from "../ui";
import { CircularDependencyError, Detective } from "../tool/detective";
import { Formatter } from "../tool/formatter";
import { Project } from "../project";
import { ProjectPaths } from "../paths";
import { doesFileExist } from "../io";

interface BuildContext {
  compilationUnit?: CompilationUnit;
}

asSubcommandTaskTree({
  filename: __filename,
  ctx: {},
  tasks: async (project: Project) => {
    // build project-level tasks for each subproject
    const tasks: Task<BuildContext>[] = [];
    for await (const subproject of project.walk()) {
      tasks.push({
        description: await subproject.resolver.resolve(ProjectPaths.root),
        shouldSkip: async () => {
          // skip if the source entrypoint doesn't exist
          if (!(await doesFileExist(await subproject.getSourceEntrypoint()))) {
            return "Project has no source code";
          }

          // skip if the fingerprint of the source directory matches
          if (
            subproject.internal.sourceFingerprint ===
            (await subproject.getSourceFingerprint())
          ) {
            return "Project is already built";
          }

          // don't skip, project needs to be built
          return false;
        },
        tasks: makeProjectBuildTasks(subproject),
      });
    }
    return tasks;
  },
});

/**
 * Generates an array of tasks for a {@link Project} that will build the
 * project's source code.
 */
function makeProjectBuildTasks(
  project: Project
): readonly Task<BuildContext>[] {
  return [
    {
      description: "Formatting project",
      fn: () => new Formatter(project.resolver).format(),
    },
    {
      description: "Checking for circular dependencies",
      fn: () => new Detective(project).assertNoCircularDependencies(),
      formatError: (err: Error) => {
        if (err instanceof CircularDependencyError) {
          let message: string[] = ["Detected circular dependencies:"];
          for (const circle of err.circles) {
            // build full path for each file
            const paths: string[] = [];
            for (let i = 0; i < circle.length; i++) {
              let path: string = circle[i];
              if (i === 0) {
                // circle root, make it a different color
                path = Chalk.yellow.underline(path);
              }
              paths.push(path);
            }

            // build a formatted message for this circle
            let indent: number = 2; // number of spaces to indent
            const lines: string[] = paths.map((path: string) => {
              let line: string = "";
              for (let i = 0; i < indent; i++) {
                line += " ";
              }
              line += `↳ ${path}`;
              indent += 2; // increase indent by 2 for each line
              return line;
            });

            // join paths into a chain
            message.push(lines.join("\n"));
          }
          return message.join("\n");
        }
        return;
      },
    },
    {
      description: "Preparing compilation unit",
      fn: async (ctx) => {
        ctx.compilationUnit = await new Compiler(project).prepare();
      },
    },
    {
      description: "Compiling project",
      fn: async (ctx) => {
        // build source
        await ctx.compilationUnit!.build();

        // update project fingerprint
        project.internal.sourceFingerprint = await project.getSourceFingerprint();
        await project.internal.flush();
      },
      formatError: (err) => {
        if (err instanceof CompilerErrorSet) {
          // build error messages from set
          const errorMessages: string[] = ["Compiler errors:"];
          for (const error of err.errors) {
            let errorMessage: string[] = [
              `  [${Chalk.yellow(error.diagnosticCode)}]`,
            ];
            if (error.location !== undefined) {
              errorMessage.push(`${Chalk.cyan.underline(error.location)}`);
            }
            errorMessage.push(error.messageText);
            errorMessages.push(errorMessage.join(" "));
          }
          return errorMessages.join("\n\n");
        }
        return;
      },
    },
  ];
}
