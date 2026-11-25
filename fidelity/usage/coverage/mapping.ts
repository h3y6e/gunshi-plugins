import env from "@h3y6e/gunshi-plugin-env";
import { withUsage } from "@h3y6e/gunshi-plugin-usage";
import type { UsageMeta, UsageOptions, UsageOutput } from "@h3y6e/gunshi-plugin-usage";
import { define, plugin } from "gunshi";
import type { ArgSchema, CliOptions, Command } from "gunshi";

import { specOf } from "../spec.ts";
import { keysOf } from "./keys.ts";

type Definition = Partial<Command> & { args?: Record<string, ArgSchema> };
type Variant = { entry: Definition; options: Partial<CliOptions>; usage?: UsageOptions };
export type Sample = (on: boolean) => Variant[];

const run = () => {};

const command =
  (f: (on: boolean) => Definition): Sample =>
  (on) => [
    { entry: f(on), options: {} },
    {
      entry: {},
      options: { subCommands: { sub: { name: "sub", run, ...f(on) } as never } },
    },
  ];

const arg =
  (...pairs: [ArgSchema, ArgSchema][]): Sample =>
  (on) =>
    pairs.flatMap(([off, set]) =>
      command(() => ({ args: { fooBar: on ? set : off, other: { type: "string" } } }))(on),
    );

const cli =
  (f: (on: boolean) => Variant): Sample =>
  (on) => [f(on)];

const options = (o: Partial<CliOptions>): Sample =>
  cli((on) => ({ entry: {}, options: on ? o : {} }));

const string: ArgSchema = { type: "string" };
const none: Record<string, ArgSchema> = {};
const positional: ArgSchema = { type: "positional" };

export const samples: Record<string, Sample> = {
  "ArgSchema.type": command((on) => ({
    args: on ? { s: string, b: { type: "boolean" }, p: positional } : none,
  })),
  "ArgSchema.short": arg([string, { ...string, short: "x" }]),
  "ArgSchema.description": arg(
    [string, { ...string, description: "d" }],
    [positional, { ...positional, description: "d" }],
  ),
  "ArgSchema.hidden": arg(
    [string, { ...string, hidden: true }],
    [positional, { ...positional, hidden: true }],
  ),
  "ArgSchema.metavar": arg(
    [string, { ...string, metavar: "V" }],
    [positional, { ...positional, metavar: "V" }],
  ),
  "ArgSchema.multiple": arg(
    [string, { ...string, multiple: true }],
    [positional, { ...positional, multiple: true }],
  ),
  "ArgSchema.negatable": arg([{ type: "boolean" }, { type: "boolean", negatable: true }]),
  "ArgSchema.parse": arg(
    [string, { ...string, parse: String }],
    [string, { type: "custom", parse: String }],
  ),
  "ArgSchema.required": arg(
    [string, { ...string, required: true }],
    [{ ...positional, required: false }, positional],
  ),
  "ArgSchema.default": arg(
    [string, { ...string, default: "d" }],
    [
      { ...positional, required: false },
      { ...positional, default: "d" },
    ],
  ),
  "ArgSchema.choices": arg([string, { type: "enum", choices: ["a"] }]),
  "ArgSchema.conflicts": arg([string, { ...string, conflicts: "other" }]),
  "ArgSchema.toKebab": arg([string, { ...string, toKebab: true }]),
  "ArgSchema.deprecated": arg(
    [string, { ...string, deprecated: true }],
    [positional, { ...positional, deprecated: true }],
  ),
  "Command.name": command((on) => (on ? { name: "renamed" } : {})),
  "Command.description": command((on) => (on ? { description: "d" } : {})),
  "Command.args": command((on) => ({ args: on ? { s: string } : none })),
  "Command.examples": command((on) => (on ? { examples: "app" } : {})),
  "Command.run": command(() => ({})),
  "Command.toKebab": command((on) => ({ toKebab: on, args: { fooBar: string } })),
  "Command.internal": command((on) => (on ? { internal: true } : {})),
  "Command.aliases": command((on) => (on ? { aliases: ["alias"] } : {})),
  "Command.deprecated": command((on) => (on ? { deprecated: true } : {})),
  "Command.passthrough": command((on) => (on ? { passthrough: true } : {})),
  "Command.entry": command((on) => (on ? { entry: true } : {})),
  "Command.rendering": command((on) => (on ? { rendering: { header: null } } : {})),
  "Command.subCommands": command((on) =>
    on ? { subCommands: { inner: define({ name: "inner", run }) } } : {},
  ),
  "CliOptions.cwd": options({ cwd: "/" }),
  "CliOptions.name": cli((on) => ({ entry: {}, options: { name: on ? "renamed" : "app" } })),
  "CliOptions.description": options({ description: "d" }),
  "CliOptions.version": options({ version: "1.0.0" }),
  "CliOptions.subCommands": options({ subCommands: { sub: define({ name: "sub", run }) } }),
  "CliOptions.leftMargin": options({ leftMargin: 4 }),
  "CliOptions.middleMargin": options({ middleMargin: 4 }),
  "CliOptions.usageOptionType": options({ usageOptionType: true }),
  "CliOptions.usageOptionValue": options({ usageOptionValue: true }),
  "CliOptions.usageSilent": options({ usageSilent: true }),
  "CliOptions.strict": options({ strict: false }),
  "CliOptions.strictPositionals": options({ strictPositionals: true }),
  "CliOptions.helpHint": options({ helpHint: false }),
  "CliOptions.validationErrorExitCode": options({ validationErrorExitCode: 2 }),
  "CliOptions.renderUsage": options({ renderUsage: null }),
  "CliOptions.renderHeader": options({ renderHeader: null }),
  "CliOptions.renderValidationErrors": options({ renderValidationErrors: null }),
  "CliOptions.fallbackToEntry": cli((on) => ({
    entry: { args: { p: positional } },
    options: { subCommands: { sub: define({ name: "sub", run }) }, fallbackToEntry: on },
  })),
  "CliOptions.plugins": options({
    plugins: [
      env(),
      plugin({
        id: "x:sample",
        setup: (ctx) => {
          ctx.addGlobalOption("g", { type: "string" });
          ctx.addCommand("added", { name: "added", run });
        },
      }),
    ],
  }),
  "CliOptions.onBeforeCommand": options({ onBeforeCommand: run }),
  "CliOptions.onAfterCommand": options({ onAfterCommand: run }),
  "CliOptions.onErrorCommand": options({ onErrorCommand: run }),
};

const meta = (on: boolean, m: UsageMeta) => (on ? withUsage({}, m) : {});

const outputs = (o: UsageOutput): Sample =>
  command((on) => ({
    args: { json: { type: "boolean" } },
    ...withUsage({}, { outputs: { o: on ? o : {} } }),
  }));

const usageOptions =
  (o: UsageOptions): Sample =>
  (on) => [
    {
      entry: {},
      options: {
        subCommands: { sub: define({ name: "sub", run }) },
        plugins: [plugin({ id: "x:g", setup: (ctx) => ctx.addGlobalOption("g", string) })],
      },
      usage: on ? o : {},
    },
  ];

const shared = { dryRun: { type: "boolean" } } as const;

export const pluginSamples: Record<string, Sample> = {
  "UsageMeta.effect": command((on) => meta(on, { effect: "write" })),
  "UsageMeta.longDescription": command((on) => meta(on, { longDescription: "d" })),
  "UsageMeta.subcommandRequired": command((on) => ({
    subCommands: { inner: define({ name: "inner", run }) },
    ...meta(on, { subcommandRequired: true }),
  })),
  "UsageMeta.outputs": command((on) => meta(on, { outputs: { text: {} } })),
  "UsageMeta.exitCodes": command((on) => meta(on, { exitCodes: { 0: "ok" } })),
  "UsageOutput.description": outputs({ description: "d" }),
  "UsageOutput.default": outputs({ default: true }),
  "UsageOutput.hidden": outputs({ hidden: true }),
  "UsageOutput.mediaType": outputs({ mediaType: "application/json" }),
  "UsageOutput.framing": outputs({ framing: "json" }),
  "UsageOutput.select": outputs({ select: "json" }),
  "UsageOutput.schema": outputs({ schema: "{}" }),
  "UsageOptions.name": usageOptions({ name: "App" }),
  "UsageOptions.description": usageOptions({ description: "d" }),
  "UsageOptions.flagsets": (on) =>
    command(() => ({ args: { ...shared } }))(on).map((v) => ({
      ...v,
      usage: on ? { flagsets: { shared } } : {},
    })),
  "UsageOptions.declaredOnly": usageOptions({ declaredOnly: true }),
  "ArgSchema.complete": arg(
    [string, { ...string, complete: "dir" }],
    [positional, { ...positional, complete: "file" }],
  ),
  "ArgSchema.env": (on) =>
    arg([string, { type: "string", env: "APP_FOO_BAR" }])(on).map((v) => ({
      ...v,
      options: { ...v.options, plugins: [env()] },
    })),
};

async function spec(variant: Variant): Promise<string> {
  const entry = { name: "app", run, ...variant.entry } as never;
  return specOf(entry, { name: "app", ...variant.options }, variant.usage);
}

function added(after: string[], before: string[]): string[] {
  const rest = [...before];
  return after.filter((k) => {
    const i = rest.indexOf(k);
    if (i === -1) return true;
    rest.splice(i, 1);
    return false;
  });
}

export interface Mapping {
  keys: string[];
  spelling: boolean;
}

export async function baseline(): Promise<string[]> {
  return [...new Set(keysOf(await spec({ entry: {}, options: {} })))].sort();
}

export async function mapping(sample: Sample): Promise<Mapping> {
  const [offs, ons] = [sample(false), sample(true)];
  const keys = new Set<string>();
  let spelling = false;
  for (const [i, on] of ons.entries()) {
    const [a, b] = [await spec(offs[i] as Variant), await spec(on)];
    for (const k of added(keysOf(b), keysOf(a))) keys.add(k);
    spelling ||= a !== b;
  }
  return {
    keys: [...keys].sort(),
    spelling: spelling && keys.size === 0,
  };
}
