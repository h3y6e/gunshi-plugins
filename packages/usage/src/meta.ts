/**
 * @license MIT
 * @author h3y6e
 */

import type { ArgSchema } from "gunshi/plugin";

/** A format a command writes to stdout */
export interface UsageOutput {
  description?: string;
  default?: true;
  hidden?: true;
  /** An IANA media type such as `application/json` */
  mediaType?: string;
  framing?: "text" | "json" | "jsonl";
  /** The key of the boolean flag that selects this output */
  select?: string;
  /** A JSON Schema, inline or as a file relative to the spec */
  schema?: string | { file: string };
}

/** What the usage spec says about a command beyond its gunshi definition */
export interface UsageMeta {
  /** What running the command does to the world; not used for the entry command */
  effect?: "read" | "write" | "destructive";
  /** Shown under `--help`; `long_about` for the entry command */
  longDescription?: string;
  /** The command does nothing without a sub-command; not used for the entry command */
  subcommandRequired?: boolean;
  /** Keyed by the value a user selects; the entry command's apply to the whole CLI */
  outputs?: Record<string, UsageOutput>;
  /** Keyed by status; the entry command's apply to the whole CLI */
  exitCodes?: Record<number, string>;
}

/**
 * Attach usage metadata to a command
 *
 * For a lazy command, attach it to the command that the loader returns.
 *
 * @param command - The command, as returned by `define`
 * @param meta - The metadata
 * @returns A new command that carries `meta`
 */
export function withUsage<C extends object & { commandName?: never }>(
  command: C,
  meta: UsageMeta,
): C {
  return { ...command, usage: meta };
}

/**
 * Set how shells complete an argument's value
 *
 * @param schema - The argument's schema
 * @param type - A usage completion type such as `dir`, `file`, or `file:json`
 * @returns A new schema that completes as `type`
 */
export function complete<S extends ArgSchema>(schema: S, type: string): S & { complete: string } {
  return { ...schema, complete: type };
}
