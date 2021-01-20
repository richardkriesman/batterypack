import { StateManager } from "./state";
import { PathResolver } from "./path";

/**
 * Manage a Rocket project.
 */
export class Project {
  public static async open(path: string): Promise<Project> {
    const resolver = new PathResolver(path);
    return new Project(resolver, await StateManager.open(resolver));
  }

  public readonly resolver: PathResolver;
  public readonly stateManager: StateManager;

  private constructor(resolver: PathResolver, stateManager: StateManager) {
    this.resolver = resolver;
    this.stateManager = stateManager;
  }
}
