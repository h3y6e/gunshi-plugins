/**
 * @license MIT
 * @author h3y6e
 */

import { plugin } from "gunshi/plugin";
import type { PluginWithoutExtension } from "gunshi/plugin";

import { withUsage } from "./meta.ts";
import { specOf } from "./spec.ts";
import type { UsageOptions } from "./spec.ts";

/** The unique identifier of the usage plugin */
export const pluginId = "h3y6e:usage" as const;
export type PluginId = typeof pluginId;

/**
 * Usage plugin
 *
 * Adds a hidden `usage` command that prints the usage KDL spec of the CLI.
 *
 * @param options - How to write the spec
 * @returns A defined plugin that adds the `usage` command
 */
export default function usage(options: UsageOptions = {}): PluginWithoutExtension {
  return plugin({
    id: pluginId,
    name: "usage",
    setup(ctx) {
      ctx.addCommand(
        "usage",
        withUsage(
          {
            name: "usage",
            description: options.description ?? "Print the usage spec",
            internal: true,
            rendering: { header: null },
            run: async (c) => console.log(await specOf(c, options)),
          },
          { effect: "read" },
        ),
      );
    },
  });
}
