import { Buffer } from "buffer";
import * as YAML from "js-yaml";

import { Derivation } from "./abstract";
import { whenAsync } from "../../helpers";
import { Project } from "../../project";

/**
 * Builds the configuration for Yarn.
 */
export class YarnDerivation implements Derivation {
  filePath = ".yarnrc.yml";
  toolId = "yarn";

  public async makeDerivation(project: Project): Promise<Buffer> {
    let contents: string = `#
# STOP! This file is automatically generated.
#
# To add your own configuration options to .yarnrc.yml,
# add them to rocket.yml, then run "rocket sync".
#
`;
    contents += YAML.dump({
      // path to the yarn executable
      yarnPath: ".yarn/releases/yarn-berry.cjs",

      // linker type - whether to use PnP or node_modules
      nodeLinker: project.config.yarn.linker,

      // registry scopes
      ...(await whenAsync(project.config.scopes, async (target) => {
        const scopes: any = {};
        for (const key of Object.keys(target)) {
          const registry = target[key];
          scopes[key] = {
            npmRegistryServer: registry.origin,
            npmPublishRegistry: registry.origin,
          };
          if (target[key].credential !== undefined) {
            if (!project.credentials.credentials[registry.credential!]) {
              throw new Error(
                `No credential named ${registry.credential} exists in ` +
                  "credentials.yml."
              );
            }
            scopes[key] = {
              ...scopes[key],
              npmAlwaysAuth: true,
              npmAuthToken: await project.credentials.fetchNpmAuthToken(
                project.credentials.credentials[registry.credential!]
              ),
            };
          }
        }
        return {
          npmScopes: scopes,
        };
      })),
    });
    return Buffer.from(contents, "utf-8");
  }
}
