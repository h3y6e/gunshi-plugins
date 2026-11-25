/**
 * @license MIT
 * @author h3y6e
 */

import { parseArgs, resolveArgs } from "gunshi";
import { plugin } from "gunshi/plugin";
import type { ArgSchema, ArgToken, PluginWithoutExtension } from "gunshi/plugin";
import { kebabnize } from "gunshi/utils";

/** The unique identifier of the env plugin */
export const pluginId = "h3y6e:env" as const;
export type PluginId = typeof pluginId;

declare module "gunshi" {
  interface ArgSchema {
    /** The environment variable a flag takes its value from when the command line does not give it */
    env?: string;
  }
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

function writtenAs(arg: ArgSchema, long: string, tokens: ArgToken[]): string {
  const written = tokens.findLast(
    ({ kind, name, rawName }) =>
      kind === "option" &&
      (rawName === `--${long}` ||
        rawName === `--no-${long}` ||
        (arg.short !== undefined && name === arg.short && rawName === `-${name}`)),
  );
  return written?.rawName ?? `--${long}`;
}

function conflictError(
  args: Record<string, ArgSchema>,
  explicit: Set<string>,
  filled: Set<string>,
  tokens: ArgToken[],
  toKebab: boolean | undefined,
): AggregateError | undefined {
  const given = new Set([...explicit, ...filled]);
  const schemas: Record<string, ArgSchema> = {};
  const argv: string[] = [];
  for (const [key, arg] of Object.entries(args)) {
    if (!given.has(key)) continue;
    const conflicts = [arg.conflicts ?? []]
      .flat()
      .filter((other) => given.has(other) && (filled.has(key) || filled.has(other)));
    const { short, toKebab: kebab } = arg;
    if (arg.type === "positional") {
      schemas[key] = { type: "positional", conflicts, toKebab: kebab };
      argv.push("_");
      continue;
    }
    const long = flagName(key, arg, toKebab);
    const name = explicit.has(key) ? writtenAs(arg, long, tokens) : `--${long}`;
    if (name === `--no-${long}`) {
      schemas[key] = { type: "boolean", negatable: true, conflicts, toKebab: kebab };
      argv.push(name);
    } else {
      schemas[key] = { type: "string", short, conflicts, toKebab: kebab };
      argv.push(name, "_");
    }
  }
  return resolveArgs(schemas, parseArgs(argv), { toKebab }).error;
}

/**
 * The fields of the command context that gunshi still lets plugins change while it builds the
 * context
 */
type Building = {
  values: Record<string, unknown>;
  validationError?: AggregateError;
  log: (...args: unknown[]) => void;
};

function asksForJson(args: Record<string, ArgSchema>, values: Record<string, unknown>): boolean {
  const json = args.json as { "~gunshi.json-arg"?: true } | undefined;
  return json?.["~gunshi.json-arg"] === true && values.json === true;
}

/**
 * Env plugin
 *
 * A flag with `env` that is not given on the command line takes the value of its variable. As in
 * usage, a boolean is true for `1`, `true`, `True`, or `TRUE` and false otherwise; any other type
 * is parsed and validated by gunshi as on the command line, and the value is checked against
 * `conflicts`. The values and the errors go into the command context while gunshi builds it, so the
 * hooks, the other plugins, and gunshi's reporting of validation errors see them as if they came
 * from the command line. A required flag still has to be given on the command line, because gunshi
 * checks it before the context is built.
 *
 * @returns A defined plugin that fills flags from environment variables
 */
export default function env(): PluginWithoutExtension {
  return plugin({
    id: pluginId,
    name: "env",
    onExtension(ctx) {
      const values: Record<string, unknown> = { ...ctx.values };
      const { args } = ctx;
      const filled = new Set<string>();
      const errors: Error[] = [];
      for (const [key, arg] of Object.entries(args)) {
        if (arg.env === undefined) continue;
        if (arg.type === "positional")
          throw new Error(`env is only read for flags, not for the positional ${key}`);
        if (ctx.explicit[key]) continue;
        const raw = process.env[arg.env];
        if (raw === undefined) continue;
        const parsed = fromEnv(key, arg, raw, ctx.toKebab);
        if (parsed.error) {
          errors.push(...parsed.error.errors);
        } else {
          values[key] = parsed.values[key];
          filled.add(key);
        }
      }
      const explicit = new Set(Object.keys(args).filter((k) => ctx.explicit[k]));
      const conflict = conflictError(args, explicit, filled, ctx.tokens, ctx.toKebab);
      errors.push(...(conflict?.errors ?? []));
      const building = ctx as Building;
      const previous = building.validationError;
      if (asksForJson(args, values) && !asksForJson(args, ctx.values)) building.log = () => {};
      building.values = values;
      if (errors.length === 0) return;
      building.validationError = new AggregateError(
        [...(previous?.errors ?? []), ...errors],
        previous?.message || errors[0]?.message,
      );
    },
  });
}
