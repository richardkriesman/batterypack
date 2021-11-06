export const META = require("../package.json");

export const DEFAULT_TARGET: string = "ES2021";
export const SCHEMA_VERSION: string = "0.5.0";

export const CONFIG_SCHEMA = require(`../docs/schemas/batterypack-${SCHEMA_VERSION}.schema.json`);
