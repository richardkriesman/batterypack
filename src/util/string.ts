const KEBAB_CASE_REGEX: RegExp = /[A-Z]+(?![a-z])|[A-Z]/g;

function toKebabCase(str: string): string {
  return str.replace(
    KEBAB_CASE_REGEX,
    (substr, args) => (args ? "-" : "") + substr.toLowerCase()
  );
}

export const StringUtil = {
  toKebabCase,
} as const;
