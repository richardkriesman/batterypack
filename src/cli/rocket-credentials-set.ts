import "source-map-support/register";
import * as Commander from "commander";

Commander.program.command("codeartifact", "AWS CodeArtifact").parse();
