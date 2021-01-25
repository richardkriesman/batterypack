import * as FS from "fs";
import * as Path from "path";
import { asSubcommand, withUiContext } from "../ui";
import { ProjectPaths } from "../paths";

asSubcommand(async (project) => {
  for await (const subproject of project.walk()) {
    const path: string = await subproject.resolver.resolve(ProjectPaths.root);
    await withUiContext(`Deleting build artifacts for ${path}`, async () => {
      // resolve paths
      const tsBuildInfoPath = Path.join(
        await subproject.resolver.resolve(ProjectPaths.dirs.derivations),
        "typescript",
        "tsconfig.tsbuildinfo"
      );
      const sourcePath: string = await subproject.resolver.resolve(
        ProjectPaths.dirs.build
      );

      // clear fingerprint
      subproject.internal.sourceFingerprint = undefined;
      subproject.internal.sourceFingerprintSeed = undefined;
      await subproject.internal.flush();

      // delete build artifacts
      try {
        await FS.promises.rmdir(sourcePath, {
          recursive: true,
        });
        await FS.promises.rm(tsBuildInfoPath);
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }
    });
  }
});
