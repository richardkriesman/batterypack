import * as FS from "fs";
import * as Path from "path";
import { asSubcommand, withUiContext } from "../ui";
import { ProjectPaths } from "../path";

asSubcommand(async (project) => {
  await withUiContext("Deleting build artifacts", async () => {
    // resolve paths
    const tsBuildInfoPath = Path.join(
      await project.resolver.resolve(ProjectPaths.dirs.derivations),
      "typescript",
      "tsconfig.tsbuildinfo"
    );
    const sourcePath: string = await project.resolver.resolve(
      ProjectPaths.dirs.build
    );

    // clear fingerprint
    project.internal.sourceFingerprint = undefined;
    project.internal.sourceFingerprintSeed = undefined;
    await project.internal.flush();

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
});
