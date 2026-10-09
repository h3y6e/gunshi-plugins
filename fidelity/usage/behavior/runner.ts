import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

import env from "@h3y6e/gunshi-plugin-env";
import usage from "@h3y6e/gunshi-plugin-usage";
import { cli, define } from "gunshi";
import type { ArgSchema, Command } from "gunshi";
import { kebabnize } from "gunshi/utils";
import { vi } from "vitest";

import { specOf } from "../spec.ts";

export type Value = string | boolean | (string | boolean)[];
export type Parsed = {
  cmd?: string[];
  flags?: Record<string, Value>;
  args?: Record<string, Value>;
};
export type Result = { ok: Parsed } | { error: string };
export type Outcome = { ok: Parsed } | { errors: string[] };

export type Definition = {
  args: Record<string, ArgSchema>;
  toKebab?: boolean;
  subCommands?: Record<string, Definition>;
};

export interface Case {
  command: Definition;
  argv: string[];
  env?: Record<string, string>;
}

const usageCodes: [RegExp, string][] = [
  [/^unexpected word: -|no such flag$/, "unknown_flag"],
  [/^Argument <__> can only be set after a `--` separator$/, "unexpected_arg"],
  [/^unexpected word: /, "unexpected_arg"],
  [/requires an argument$/, "missing_flag_value"],
  [/^Missing required flag/, "missing_required_flag"],
  [/^Missing required arg/, "missing_required_arg"],
  [/^Invalid choice/, "invalid_choice"],
  [/conflicts with/, "conflicting_flags"],
  [/^Invalid value/, "invalid_value"],
];

const gunshiCodes: Record<string, string> = {
  "err:arg:required-option": "missing_required_flag",
  "err:arg:required-positional": "missing_required_arg",
  "err:arg:invalid-type": "invalid_value",
  "err:arg:invalid-choice": "invalid_choice",
  "err:arg:custom-parse": "invalid_value",
  "err:arg:unknown-option": "unknown_flag",
  "err:arg:unexpected-value": "invalid_value",
  "err:arg:missing-value": "missing_flag_value",
  "err:arg:conflict": "conflicting_flags",
  "err:cmd:not-found": "unexpected_arg",
};

const flagName = (key: string, arg: ArgSchema, toKebab: boolean | undefined) =>
  toKebab || arg.toKebab ? kebabnize(key) : key;

const base = {
  name: "ex",
  strict: true,
  renderHeader: null,
  renderValidationErrors: null,
  plugins: [env()],
};

function words(line: string): string[] {
  return [...line.matchAll(/'((?:[^']|'\\'')*)'|(\S+)/g)].map(
    ([, quoted, bare]) => quoted?.replaceAll("'\\''", "'") ?? bare ?? "",
  );
}

function definitionAt(root: Definition, path: string[]): Definition {
  return path.reduce((d, name) => d.subCommands?.[name] ?? d, root);
}

function parsed(
  definition: Definition,
  path: string[],
  value: (key: string, arg: ArgSchema, name: string) => Value | undefined,
): Parsed {
  const result: Parsed = path.length > 0 ? { cmd: path } : {};
  for (const [key, arg] of Object.entries(definition.args)) {
    const name = flagName(key, arg, definition.toKebab);
    const v = value(key, arg, name);
    if (v === undefined) continue;
    const group = arg.type === "positional" ? "args" : "flags";
    result[group] = { ...result[group], [name]: v };
  }
  return result;
}

function build(c: Case, ran: (path: string[], values: Record<string, unknown>) => void) {
  const command = (name: string, d: Definition, path: string[]): Command =>
    define({
      name,
      args: d.args,
      toKebab: d.toKebab,
      subCommands: subs(d, path),
      run: (ctx: { values: Record<string, unknown> }) => ran(path, ctx.values),
    });
  const subs = (d: Definition, path: string[]): Record<string, Command> =>
    Object.fromEntries(
      Object.entries(d.subCommands ?? {}).map(([n, s]) => [n, command(n, s, [...path, n])]),
    );
  return {
    entry: command("ex", { ...c.command, subCommands: undefined }, []),
    options: { ...base, subCommands: subs(c.command, []) },
  };
}

export function matches(outcome: Outcome, expected: Result): boolean {
  if ("errors" in outcome) return "error" in expected && outcome.errors.includes(expected.error);
  return "ok" in expected && JSON.stringify(outcome.ok) === JSON.stringify(expected.ok);
}

export function same(a: Outcome, b: Outcome): boolean {
  if ("errors" in a || "errors" in b) {
    return "errors" in a && "errors" in b && a.errors.some((e) => b.errors.includes(e));
  }
  return JSON.stringify(a.ok) === JSON.stringify(b.ok);
}

export async function viaUsage(c: Case, spec: string): Promise<Outcome> {
  const { entry, options } = build(c, () => {});
  writeFileSync(spec, await specOf(entry, options));
  const explain = spawnSync(
    "usage",
    ["explain", "-f", spec, "--format", "json", "--", "ex", ...c.argv],
    {
      encoding: "utf8",
      env: { ...process.env, ...c.env },
    },
  );
  const report = JSON.parse(explain.stdout);
  const messages: string[] = [...report.errors, ...(report.refused ? [report.refused] : [])];
  if (messages.length > 0) {
    return {
      errors: messages.map((message) => {
        const code = usageCodes.find(([pattern]) => pattern.test(message))?.[1];
        if (!code) throw new Error(`unclassified usage error: ${message}`);
        return code;
      }),
    };
  }
  const path: string[] = report.command.slice(1);
  const values: { kind: string; name: string; value: string }[] = report.values;
  return {
    ok: parsed(definitionAt(c.command, path), path, (_, arg, name) => {
      const found = values.find(
        (e) => e.name === name && e.kind === (arg.type === "positional" ? "arg" : "flag"),
      );
      if (!found) return undefined;
      const typed = (s: string) => (arg.type === "boolean" ? s === "true" : s);
      return arg.multiple ? words(found.value).map(typed) : typed(found.value);
    }),
  };
}

export async function viaGunshi(c: Case): Promise<Outcome> {
  let ran: { path: string[]; values: Record<string, unknown> } | undefined;
  const { entry, options } = build(c, (path, values) => void (ran = { path, values }));
  for (const [k, value] of Object.entries(c.env ?? {})) vi.stubEnv(k, value);
  try {
    await cli(c.argv, entry, { ...options, plugins: [...options.plugins, usage()] });
  } catch (error) {
    const codes: string[] = (error as AggregateError).errors.map((e: { code: string }) => e.code);
    return { errors: codes.map((code) => gunshiCodes[code] ?? code) };
  } finally {
    vi.unstubAllEnvs();
  }
  if (!ran) throw new Error("gunshi ran no command");
  const { path, values } = ran;
  const text = (x: unknown) => (typeof x === "boolean" ? x : String(x));
  return {
    ok: parsed(definitionAt(c.command, path), path, (key) => {
      const v = values[key];
      if (v === undefined) return undefined;
      return Array.isArray(v) ? v.map(text) : text(v);
    }),
  };
}
