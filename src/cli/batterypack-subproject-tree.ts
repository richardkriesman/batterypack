import "source-map-support/register";
import * as Commander from "commander";

Commander.program.command("tree", "show the subproject tree").parse();
