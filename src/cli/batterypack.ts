#!/usr/bin/env node
import "source-map-support/register";
import * as Commander from "commander";

const META = require("../../package.json");

// register subcommands
Commander.program
  .version(META.version)
  .command("build", "compile project source code")
  .command("clean", "delete build artifacts")
  .command("credentials", "manage user credentials")
  .command("sync", "sync project configuration files")
  .parseAsync()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });