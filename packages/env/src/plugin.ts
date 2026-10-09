/**
 * @license MIT
 * @author h3y6e
 */

import { parseArgs, resolveArgs } from "gunshi";
import { plugin } from "gunshi/plugin";
import type { ArgSchema, PluginWithExtension } from "gunshi/plugin";
import { kebabnize } from "gunshi/utils";

/** The unique identifier of the env plugin */
export const pluginId = "h3y6e:env" as const;
export type PluginId = typeof pluginId;

/** The env plugin's extension on the command context */
export interface EnvExtension {
  /** The environment variable that fills the flag with this key */
  name: (key: string) => string;
}

const BUILTINS = new Set(["help", "version"]);

function snake(text: string): string {
  return text
    .replaceAll(/([a-z0-9])([A-Z])|([A-Z])([A-Z][a-z])/g, "$1$3_$2$4")
    .replaceAll(/[^A-Za-z0-9]+/g, "_")
    .replaceAll(/^_|_$/g, "")
    .toUpperCase();
}

function flagName(key: string, arg: ArgSchema, toKebab: boolean | undefined): string {
  return toKebab || arg.toKebab ? kebabnize(key) : key;
}

function fromEnv(key: string, arg: ArgSchema, raw: string, toKebab: boolean | undefined) {
  const value = arg.type === "boolean" ? String(["1", "true", "True", "TRUE"].includes(raw)) : raw;
  const { type, choices, parse, multiple } = arg;
  const schema = { type, choices, parse, multiple, toKebab: arg.toKebab };
  const token = `--${flagName(key, arg, toKebab)}=${value}`;
  return resolveArgs({ [key]: schema }, parseArgs([token]), { toKebab });
}

function conflictError(
  args: Record<string, ArgSchema>,
  given: (key: string) => boolean,
  toKebab: boolean | undefined,
): AggregateError | undefined {
  const schemas: Record<string, ArgSchema> = {};
  const argv: string[] = [];
  for (const [key, arg] of Object.entries(args)) {
    if (!given(key)) continue;
    schemas[key] = { type: "string", conflicts: arg.conflicts, toKebab: arg.toKebab };
    argv.push(`--${flagName(key, arg, toKebab)}=_`);
  }
  return resolveArgs(schemas, parseArgs(argv), { toKebab }).error;
}

/**
 * Env plugin
 *
 * A flag that is not given on the command line takes the value of `<CLI>_<FLAG>`, both in upper
 * snake case. As in usage, a boolean is true for `1`, `true`, `True`, or `TRUE` and false
 * otherwise; any other type is parsed and validated by gunshi as on the command line, and the value
 * is checked against `conflicts`. A required flag still has to be given on the command line,
 * because gunshi checks it before plugins run, and the command hooks see the values before the
 * variables fill them.
 *
 * @returns A defined plugin that fills flags from environment variables
 */
export default function env(): PluginWithExtension<EnvExtension> {
  return plugin({
    id: pluginId,
    name: "env",
    extension: (ctx): EnvExtension => {
      const cli = ctx.env.name;
      if (!cli) throw new Error("The env plugin names variables after the CLI; give cli() a name");
      return { name: (key) => `${snake(cli)}_${snake(key)}` };
    },
    setup(ctx) {
      ctx.decorateCommand((run) => async (c) => {
        const { name } = c.extensions[pluginId];
        const values: Record<string, unknown> = { ...c.values };
        const args: Record<string, ArgSchema> = c.args;
        const filled = new Set<string>();
        const errors: unknown[] = [];
        for (const [key, arg] of Object.entries(args)) {
          const builtin = BUILTINS.has(key) && c.env.globalOptions?.has(key);
          if (arg.type === "positional" || builtin || c.explicit[key]) continue;
          const raw = process.env[name(key)];
          if (raw === undefined) continue;
          const parsed = fromEnv(key, arg, raw, c.toKebab);
          if (parsed.error) {
            errors.push(...parsed.error.errors);
          } else {
            values[key] = parsed.values[key];
            filled.add(key);
          }
        }
        const given = (k: string) => c.explicit[k] || filled.has(k);
        errors.push(...(conflictError(args, given, c.toKebab)?.errors ?? []));
        if (errors.length > 0) {
          const error = new AggregateError(errors);
          const message = await c.env.renderValidationErrors?.(c, error);
          if (message) c.log(message);
          throw error;
        }
        return run({ ...c, values } as typeof c);
      });
    },
  });
}
