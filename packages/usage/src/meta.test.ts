import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import env from "@h3y6e/gunshi-plugin-env";
import { cli, define, lazy } from "gunshi";
import { plugin } from "gunshi/plugin";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import usage, { withUsage } from "./index.ts";
import type { UsageOptions } from "./index.ts";

type Options = NonNullable<Parameters<typeof cli>[2]>;

const run = () => {};

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "gunshi-plugin-usage-meta-"));
  writeFileSync(join(dir, "result.schema.json"), '{"type":"object"}');
});

afterAll(() => {
  rmSync(dir, { recursive: true });
});

async function generate(
  entry: Parameters<typeof cli>[1],
  options: Options,
  usageOptions: UsageOptions,
): Promise<string> {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  await cli(["usage"], entry, {
    ...options,
    plugins: [...(options.plugins ?? []), usage({ declaredOnly: true, ...usageOptions })],
  });
  const spec = log.mock.calls.map((call) => call.join(" ")).join("\n");
  log.mockRestore();
  return spec;
}

function usageCli(...args: string[]) {
  return spawnSync("usage", args, { encoding: "utf8" });
}

function compare(expected: string, actual: string) {
  const files = {
    expected: join(dir, "expected.usage.kdl"),
    actual: join(dir, "actual.usage.kdl"),
  };
  writeFileSync(files.expected, expected);
  writeFileSync(files.actual, actual);
  const json = (file: string) => JSON.parse(usageCli("generate", "json", "-f", file).stdout);
  const lint = usageCli("lint", files.actual);
  const forward = usageCli("diff", files.expected, files.actual);
  const backward = usageCli("diff", files.actual, files.expected);
  return {
    lint: `${lint.status} ${lint.stderr}`,
    forward: forward.stdout.trim(),
    backward: backward.stdout.trim(),
    same: JSON.stringify(json(files.expected)) === JSON.stringify(json(files.actual)),
  };
}

const write = {
  dryRun: { type: "boolean", description: "Change nothing" },
  to: { type: "string", metavar: "dir" },
} as const;

const usageCommand = 'cmd "usage" help="Print the usage spec" effect="read" hide=#true';

const fixtures: {
  construct: string;
  entry: Parameters<typeof cli>[1];
  options?: Partial<Options>;
  usage?: UsageOptions;
  expected: string;
}[] = [
  {
    construct: "a command's effect",
    entry: define({ name: "app", run }),
    options: {
      subCommands: {
        ls: withUsage(define({ name: "ls", run }), { effect: "read" }),
        add: withUsage(define({ name: "add", run }), { effect: "write" }),
        rm: withUsage(define({ name: "rm", run }), { effect: "destructive" }),
      },
    },
    expected: `
      cmd "ls" effect="read"
      cmd "add" effect="write"
      cmd "rm" effect="destructive"`,
  },
  {
    construct: "outputs and exit codes of the CLI and of a command",
    entry: withUsage(define({ name: "app", args: { json: { type: "boolean" } }, run }), {
      outputs: {
        text: { default: true, description: "For people" },
        json: {
          mediaType: "application/json",
          framing: "json",
          select: "json",
          schema: { file: "result.schema.json" },
        },
      },
      exitCodes: { 0: "success", 1: "failure", 2: "misuse" },
    }),
    options: {
      subCommands: {
        brief: withUsage(define({ name: "brief", run }), {
          outputs: {
            markdown: { mediaType: "text/markdown", default: true },
            text: { hidden: true },
            events: { framing: "jsonl", schema: '{"type":"object"}' },
          },
          exitCodes: { 3: "no budget" },
        }),
      },
    },
    expected: `
      flag "--json"
      output "text" default=#true help="For people"
      output "json" media_type="application/json" framing="json" select="--json" {
        schema file="result.schema.json"
      }
      exit_code 0 "success"
      exit_code 1 "failure"
      exit_code 2 "misuse"
      cmd "brief" {
        output "markdown" media_type="text/markdown" default=#true
        output "text" hide=#true
        output "events" framing="jsonl" {
          schema "{\\"type\\":\\"object\\"}"
        }
        exit_code 3 "no budget"
      }`,
  },
  {
    construct: "a flagset shared by commands",
    entry: define({ name: "app", run }),
    options: {
      subCommands: {
        add: define({
          name: "add",
          toKebab: true,
          args: { force: { type: "boolean" }, ...write },
          run,
        }),
        rm: define({ name: "rm", toKebab: true, args: { ...write }, run }),
        ls: define({ name: "ls", args: { dryRun: { type: "boolean" } }, run }),
      },
    },
    usage: { flagsets: { write } },
    expected: `
      flagset "write" {
        flag "--dry-run" help="Change nothing"
        flag "--to <dir>"
      }
      cmd "add" {
        flag "--force"
        use "write"
      }
      cmd "rm" {
        use "write"
      }
      cmd "ls" {
        flag "--dryRun"
      }`,
  },
  {
    construct: "completions of a flag and a positional",
    entry: define({
      name: "app",
      args: {
        file: { type: "positional", complete: "file:json" },
        out: { type: "string", complete: "dir" },
      },
      run,
    }),
    expected: `
      arg "<file>" {
        complete type="file:json"
      }
      flag "--out <out>" {
        complete type="dir"
      }`,
  },
  {
    construct: "choices that gunshi does and does not enforce",
    entry: define({
      name: "app",
      args: {
        mode: { type: "enum", choices: ["fast", "safe"] },
        source: { type: "string", choices: ["cli", "chat"], default: "cli" },
      },
      run,
    }),
    expected: `
      flag "--mode <mode>" {
        choices "fast" "safe"
      }
      flag "--source <source>" default="cli" {
        choices strict=#false "cli" "chat"
      }`,
  },
  {
    construct: "a command that needs a sub-command",
    entry: define({ name: "app", run }),
    options: {
      subCommands: {
        asset: withUsage(
          define({ name: "asset", subCommands: { add: define({ name: "add", run }) } }),
          { subcommandRequired: true },
        ),
      },
    },
    expected: `
      cmd "asset" subcommand_required=#true {
        cmd "add"
      }`,
  },
  {
    construct: "long descriptions of the CLI and of a command",
    entry: withUsage(define({ name: "app", run }), { longDescription: "All about app" }),
    options: {
      subCommands: {
        sync: withUsage(define({ name: "sync", description: "Sync", run }), {
          longDescription: "All about sync",
        }),
      },
    },
    expected: `
      long_about "All about app"
      cmd "sync" help="Sync" long_help="All about sync"`,
  },
  {
    construct: "global options with value names, a short, and variables",
    entry: define({ name: "app", run }),
    options: {
      subCommands: { status: define({ name: "status", run }) },
      plugins: [
        plugin({
          id: "x:globals",
          setup: (ctx) => {
            ctx.addGlobalOption("project", {
              type: "string",
              short: "C",
              metavar: "dir",
              env: "APP_PROJECT",
            });
            ctx.addGlobalOption("as", { type: "string", metavar: "actor", env: "APP_ACTOR" });
            ctx.addGlobalOption("no-color", { type: "boolean" });
          },
        }),
        env(),
      ],
    },
    expected: `
      flag "-C --project <dir>" global=#true env="APP_PROJECT"
      flag "--as <actor>" global=#true env="APP_ACTOR"
      flag "--no-color" global=#true
      cmd "status"`,
  },
  {
    construct: "value names of flags and positionals",
    entry: define({
      name: "app",
      toKebab: true,
      args: {
        fileOrUri: { type: "positional" },
        memory: { type: "positional", multiple: true, required: true },
        budget: { type: "number", metavar: "tokens", default: 8000 },
        text: { type: "string", short: "m", metavar: "text", required: true },
      },
      run,
    }),
    expected: `
      arg "<file-or-uri>"
      arg "<memory>..."
      flag "--budget <tokens>" default="8000"
      flag "-m --text <text>" required=#true`,
  },
  {
    construct: "a lazy command whose loader returns a command with metadata",
    entry: define({ name: "app", run }),
    options: {
      subCommands: {
        sync: lazy(async () => withUsage(define({ name: "sync", run }), { effect: "write" }), {
          name: "sync",
        }),
      },
    },
    expected: `
      cmd "sync" effect="write"`,
  },
  {
    construct: "a global option whose short a root flag takes",
    entry: define({ name: "app", args: { verbose: { type: "boolean", short: "v" } }, run }),
    options: {
      plugins: [
        plugin({
          id: "x:global-short",
          setup: (ctx) => ctx.addGlobalOption("version-check", { type: "boolean", short: "v" }),
        }),
      ],
    },
    expected: `
      flag "--version-check" global=#true
      flag "-v --verbose"`,
  },
  {
    construct: "a display name apart from the command name",
    entry: define({ name: "app", run }),
    usage: { name: "App" },
    expected: "",
  },
];

describe("usage metadata", () => {
  test("when withUsage is given a lazy command, type checking rejects it", () => {
    // Arrange
    const loader = lazy(async () => define({ name: "sync", run }), { name: "sync" });

    // Act
    // @ts-expect-error metadata belongs on the command the loader returns
    const wrapped = () => withUsage(loader, { effect: "write" });

    // Assert
    expect(wrapped).toBeTypeOf("function");
  });

  test.each(fixtures)(
    "when a CLI declares $construct, its spec passes usage lint and matches the expected KDL both ways",
    async ({ entry, options, usage: usageOptions, expected }) => {
      // Arrange
      const name = usageOptions?.name ?? "app";
      const kdl = [
        `name "${name}"`,
        'bin "app"',
        'unknown_flags "error"',
        expected.replaceAll(/^ {6}/gm, ""),
        usageCommand,
      ]
        .join("\n")
        .replaceAll("\n\n", "\n");

      // Act
      const actual = await generate(entry, { name: "app", ...options }, usageOptions ?? {});

      // Assert
      expect(compare(kdl, actual)).toEqual({
        lint: "0 ",
        forward: "No interface changes.",
        backward: "No interface changes.",
        same: true,
      });
    },
  );
});
