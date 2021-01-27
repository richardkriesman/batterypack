import "source-map-support/register";
import Chalk from "chalk";
import { CompilationUnit, Compiler, CompilerErrorSet } from "../tool/compiler";
import { asSubcommandAsync, UiTask, withUiTaskList } from "../ui";
import { CircularDependencyError, Detective } from "../tool/detective";
import { Formatter } from "../tool/formatter";
import { Project } from "../project";
import { ProjectPaths } from "../paths";
import { doesFileExist } from "../io";

interface BuildContext {
  compilationUnit?: CompilationUnit;
}

asSubcommandAsync({
  filename: __filename,
  foreground: (observer) => {
    observer.on("test", (data) => {
      console.log("お早う御座います！", data);
    });
  },
  background: async (project, opts, dispatcher) => {
    /*
      Build an array of subprojects by walking down the subproject tree.
      The array is then reversed, allowing dependent subprojects to be built
      first.
    */
    let subprojects: Project[] = [];
    for await (const subproject of project.walk()) {
      subprojects.push(subproject);
    }
    subprojects.reverse();

    // build tasks for each subproject
    const tasks: UiTask<BuildContext>[] = [];
    for (const subproject of subprojects) {
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
        fn: async () => makeProjectBuildTasks(subproject),
      });
    }

    // run the task list
    await withUiTaskList({}, tasks);
  },
});

/**
 * Generates an array of tasks for a {@link Project} that will build the
 * project's source code.
 */
function makeProjectBuildTasks(
  project: Project
): readonly UiTask<BuildContext>[] {
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
        await ctx.compilationUnit!.build();
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
    {
      description: "Updating project state",
      fn: async () => {
        project.internal.sourceFingerprint = await project.getSourceFingerprint();
        await project.internal.flush();
      },
    },
  ];
}
