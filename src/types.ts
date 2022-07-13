export interface HumanReadable {
  toHumanReadable(): string;
}

export const HumanReadable = {
  is(x: unknown): x is HumanReadable {
    return (
      typeof x === "object" && typeof (x as any).toHumanReadable === "function"
    );
  },
};
