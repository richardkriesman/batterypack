import "source-map-support/register";
import * as Commander from "commander";
import { Subcommand } from "./subcommand";
import { BuildSubcommand } from "./subcommand/build";

const META = require("../package.json");

// configure cli
const program = new Commander.Command(META.name);

// register subcommands
const subcommands: Subcommand[] = [
  new BuildSubcommand(program.createCommand("build")),
];
for (const subcommand of subcommands) {
  program.addCommand(subcommand.commander);
}

// set version and parse args
program.version(META.version).parse(process.argv);
