/**
 * @license MIT
 * @author h3y6e
 */

import { plugin } from "gunshi/plugin";
import type { PluginWithoutExtension } from "gunshi/plugin";
import { isLazyCommand, resolveLazyCommand } from "gunshi/utils";

import { specOf } from "./spec.ts";

/** The unique identifier of the usage plugin */
export const pluginId = "h3y6e:usage" as const;
export type PluginId = typeof pluginId;

/**
 * Usage plugin
 *
 * Adds a hidden `usage` command that prints the usage KDL spec of the CLI.
 *
 * @returns A defined plugin that adds the `usage` command
 */
export default function usage(): PluginWithoutExtension {
  return plugin({
    id: pluginId,
    name: "usage",
    setup(ctx) {
      ctx.addCommand("usage", {
        name: "usage",
        description: "Print the usage spec",
        internal: true,
        rendering: { header: null },
        run: async (c) => {
          const entry = c.env.entryCommand;
          if (!entry) throw new Error("The usage command needs the entry command");
          const loaded = isLazyCommand(entry)
            ? await resolveLazyCommand(entry, c.env.name, true)
            : entry;
          console.log(await specOf(c, loaded));
        },
      });
    },
  });
}
