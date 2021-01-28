export class BatterypackError extends Error {
  public readonly showMinimal: boolean;

  /**
   * Creates a new {@link BatterypackError}.
   *
   * @param message Message to display
   * @param showMinimal Whether to only show the message when printing the
   *                    error, excluding the name and stack trace.
   */
  public constructor(message?: string, showMinimal: boolean = false) {
    super(message);
    Object.setPrototypeOf(this, BatterypackError.prototype);
    this.name = "BatterypackError";
    this.showMinimal = showMinimal;
  }
}
