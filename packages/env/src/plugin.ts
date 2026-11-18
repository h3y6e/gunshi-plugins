/**
 * @license MIT
 * @author h3y6e
 */

import { parseArgs, resolveArgs } from "gunshi";
import { plugin } from "gunshi/plugin";
import type { ArgSchema, PluginWithoutExtension } from "gunshi/plugin";
import { kebabnize } from "gunshi/utils";

/** The unique identifier of the env plugin */
export const pluginId = "h3y6e:env" as const;
export type PluginId = typeof pluginId;

/**
 * Let a flag take the value of an environment variable when the command line does not give it
 *
 * @param schema - The flag's schema
 * @param name - The environment variable
 * @returns A new schema that reads `name`
 */
export function withEnv<S extends ArgSchema & { type: Exclude<ArgSchema["type"], "positional"> }>(
  schema: S,
  name: string,
): S & { env: string } {
  return { ...schema, env: name };
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
 * A flag marked with {@link withEnv} that is not given on the command line takes the value of its
 * variable. As in usage, a boolean is true for `1`, `true`, `True`, or `TRUE` and false otherwise;
 * any other type is parsed and validated by gunshi as on the command line, and the value is checked
 * against `conflicts`. A required flag still has to be given on the command line, because gunshi
 * checks it before plugins run, and the command hooks see the values before the variables fill
 * them.
 *
 * @returns A defined plugin that fills flags from environment variables
 */
export default function env(): PluginWithoutExtension {
  return plugin({
    id: pluginId,
    name: "env",
    setup(ctx) {
      ctx.decorateCommand((run) => async (c) => {
        const values: Record<string, unknown> = { ...c.values };
        const args: Record<string, ArgSchema & { env?: string }> = c.args;
        const filled = new Set<string>();
        const errors: unknown[] = [];
        for (const [key, arg] of Object.entries(args)) {
          if (arg.env === undefined || c.explicit[key]) continue;
          const raw = process.env[arg.env];
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
