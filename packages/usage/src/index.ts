/**
 * The entry point of usage plugin
 *
 * Generates a [usage](https://usage.jdx.dev) KDL spec from a gunshi CLI.
 *
 * @module
 * @example
 *   import usage from "@h3y6e/gunshi-plugin-usage";
 *   import { cli, define } from "gunshi";
 *
 *   const command = define({
 *     name: "greet",
 *     args: {
 *       name: { type: "positional", description: "Who to greet" },
 *     },
 *     run: (ctx) => console.log(`Hello, ${ctx.values.name}!`),
 *   });
 *
 *   await cli(process.argv.slice(2), command, {
 *     name: "greet",
 *     version: "1.0.0",
 *     description: "Greet someone",
 *     plugins: [usage()],
 *   });
 */

/**
 * @license MIT
 * @author h3y6e
 */

export { default, pluginId } from "./plugin.ts";
export type { PluginId } from "./plugin.ts";
