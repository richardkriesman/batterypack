#!/usr/bin/env node
import "source-map-support/register";

import {
  BuildAction,
  CleanAction,
  CredentialsGroup,
  DependencyGroup,
  SubprojectGroup,
  SyncAction,
  TestAction,
} from "@project/command";
import { META } from "@project/meta";
import { Group } from "@project/ui";
import { BatterypackError } from "@project/errors";
import { HumanReadable } from "@project/types";

Group.buildCommanderConfig({
  type: "group",
  name: "batterypack",
  description:
    "batterypack is an integrated toolchain for Node.js and TypeScript.\n\n" +
    "https://www.npmjs.com/package/batterypack",
  commands: [
    BuildAction,
    CleanAction,
    CredentialsGroup,
    DependencyGroup,
    SubprojectGroup,
    SyncAction,
    TestAction,
  ],
})
  .version(META.version)
  .parseAsync()
  .catch((err) => {
    if (HumanReadable.is(err)) {
      console.log(`\n${err.toHumanReadable()}`);
    } else if (err instanceof BatterypackError && err.showMinimal) {
      console.log(err.message);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
