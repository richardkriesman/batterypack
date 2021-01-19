#!/usr/bin/env node
import "source-map-support/register";
import * as Commander from "commander";
import { Subcommand } from "./subcommand";
import { BuildSubcommand } from "./subcommand/build";
import { CleanSubcommand } from "./subcommand/clean";

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
  new CleanSubcommand(
    program.createCommand("clean").description("delete build outputs")
  ),
];
for (const subcommand of subcommands) {
  program.addCommand(subcommand.commander);
}

// set version and parse args
program.version(META.version).parse(process.argv);
