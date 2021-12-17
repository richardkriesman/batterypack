export type Flag = {
  /**
   * A single letter shorthand for this flag, which can be used with the
   * `-` flag prefix. Short flags can be combined like so: `-abc`.
   */
  shortName?: FlagShortName;
  /**
   * Description of the flag, which will be shown on the help page.
   */
  description: string;
  /**
   * Whether the flag is required.
   */
  required?: boolean;
};

export type StringFlag = Flag & {
  type: "string";
};

export type SwitchFlag = Flag & {
  type: "switch";
};

export type FlagFullName = Exclude<string, "project">;

export type FlagShortName =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  // h is omitted because it's used to display the help page
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  // p is omitted because it's used to specify a project directory
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

export type FlagParams = Record<FlagFullName, string | boolean>;

export type FlagMap<F extends FlagParams> = {
  [K in keyof F]: F[K] extends string
    ? StringFlag
    : F[K] extends boolean
    ? SwitchFlag
    : never;
};
