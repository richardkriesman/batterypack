import "source-map-support/register";
import * as Commander from "commander";

Commander.program
  .command("set", "set user credentials")
  .command("list", "list user credentials")
  .parse();
