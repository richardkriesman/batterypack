#!/usr/bin/env node
import "source-map-support/register";
import * as Commander from "commander";
import { Subcommand } from "./subcommand";
import { BuildSubcommand } from "./subcommand/build";
import { SyncSubcommand } from "./subcommand/sync";

const META = require("../package.json");

// configure cli
const program = new Commander.Command("rocket");

// register subcommands
const subcommands: Subcommand[] = [
  new BuildSubcommand(
    program
      .createCommand("build")
      .description("compile the project's source code")
  ),
  new SyncSubcommand(
    program
      .createCommand("sync")
      .description("sync project configuration files")
  ),
];
for (const subcommand of subcommands) {
  program.addCommand(subcommand.commander);
}

// set version and parse args
program.version(META.version).parse(process.argv);
