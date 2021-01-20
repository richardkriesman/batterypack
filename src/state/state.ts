/**
 * Project state representation. Rocket uses this state to build derivations
 * for tool-specific configuration files.
 */
export interface State {
  /**
   * ignore rules
   */
  gitignore: string[];

  /**
   * To use a package registry other than NPM, define it here.
   */
  registry?: {
    origin: string;
    authToken: string;
  };

  /**
   * .yarnrc.yml configuration
   */
  yarn: {
    linker: "pnp" | "node-modules";
  };
}
