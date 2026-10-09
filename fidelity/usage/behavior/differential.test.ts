import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import fc from "fast-check";
import type { ArgSchema } from "gunshi";
import { afterAll, expect, test } from "vitest";

import { same, viaGunshi, viaUsage } from "./runner.ts";
import type { Case } from "./runner.ts";

const dir = mkdtempSync(join(tmpdir(), "gunshi-plugin-usage-differential-"));

afterAll(() => {
  rmSync(dir, { recursive: true });
});

const names = ["alpha", "beta", "dryRun", "outputURL"] as const;
const shorts: Record<string, string> = { alpha: "a", beta: "b", dryRun: "d", outputURL: "o" };

const flag = (name: (typeof names)[number]) =>
  fc
    .record({
      type: fc.constantFrom("boolean", "string", "enum"),
      short: fc.boolean(),
      required: fc.boolean(),
      default: fc.boolean(),
      multiple: fc.boolean(),
      negatable: fc.boolean(),
      conflicts: fc.option(fc.constantFrom(...names.filter((n) => n !== name)), { nil: undefined }),
    })
    .map((f): ArgSchema => {
      const common = {
        ...(f.short && { short: shorts[name] }),
        ...(f.conflicts && { conflicts: f.conflicts }),
      };
      if (f.type === "boolean") return { type: "boolean", negatable: f.negatable, ...common };
      const value =
        f.type === "enum"
          ? { type: "enum" as const, choices: ["a", "b"] }
          : { type: "string" as const };
      return {
        ...value,
        ...common,
        ...(f.required ? { required: true } : f.default && { default: "a" }),
        ...(f.multiple && { multiple: true }),
      };
    });

const positional = fc.constantFrom<ArgSchema>(
  { type: "positional" },
  { type: "positional", required: false },
  { type: "positional", default: "z" },
  { type: "positional", multiple: true },
);

const args = fc
  .record({
    alpha: fc.option(flag("alpha"), { nil: undefined }),
    beta: fc.option(flag("beta"), { nil: undefined }),
    dryRun: fc.option(flag("dryRun"), { nil: undefined }),
    outputURL: fc.option(flag("outputURL"), { nil: undefined }),
    pos: fc.option(positional, { nil: undefined }),
  })
  .map((a) =>
    Object.fromEntries(
      Object.entries(a).filter((e): e is [string, ArgSchema] => e[1] !== undefined),
    ),
  );

const definition = fc.record({
  args,
  toKebab: fc.boolean(),
  subCommands: fc.option(fc.record({ sub: fc.record({ args, toKebab: fc.boolean() }) }), {
    nil: undefined,
  }),
});

const spellings = [...names, "dry-run"];

const token = fc.oneof(
  fc.constantFrom(...spellings).map((n) => [`--${n}`]),
  fc.tuple(fc.constantFrom(...spellings), fc.constantFrom("a", "x")).map(([n, v]) => [`--${n}`, v]),
  fc
    .tuple(fc.constantFrom(...spellings), fc.constantFrom("a", "x", "true"))
    .map(([n, v]) => [`--${n}=${v}`]),
  fc.constantFrom(...spellings).map((n) => [`--no-${n}`]),
  fc
    .tuple(fc.constantFrom(...Object.values(shorts)), fc.constantFrom("a", "x"))
    .map(([s, v]) => [`-${s}`, v]),
  fc.constantFrom(["-ab"], ["-ad"]),
  fc.constantFrom(["p"], ["q"], ["--", "p"], ["--zzz"]),
);

const environment = fc
  .record({
    EX_ALPHA: fc.option(fc.constantFrom("a", "x", "1", "0"), { nil: undefined }),
    EX_BETA: fc.option(fc.constantFrom("a", "x", "1", "0"), { nil: undefined }),
    EX_DRY_RUN: fc.option(fc.constantFrom("a", "x", "1", "0"), { nil: undefined }),
    EX_OUTPUT_URL: fc.option(fc.constantFrom("a", "x", "1", "0"), { nil: undefined }),
  })
  .map((e) =>
    Object.fromEntries(
      Object.entries(e).flatMap(([k, v]): [string, string][] => (v === undefined ? [] : [[k, v]])),
    ),
  );

const cases: fc.Arbitrary<Case> = fc.record({
  command: definition,
  argv: fc
    .tuple(fc.boolean(), fc.array(token, { maxLength: 4 }))
    .map(([sub, t]) => [...(sub ? ["sub"] : []), ...t.flat()]),
  env: environment,
});

test("when gunshi and usage explain read the same random definition, argv, and env, they select the same command and bind the same values, or fail with the same error", async () => {
  // Arrange
  const spec = join(dir, "case.usage.kdl");
  const property = fc.asyncProperty(cases, async (c) => {
    const unreachable = c.command.subCommands && "pos" in c.command.args;
    const valued = (s: string) =>
      [c.command.args, c.command.subCommands?.sub.args ?? {}]
        .flatMap((args) => Object.values(args))
        .some((arg) => arg.short === s && arg.type !== "boolean");
    const grouped = c.argv.some(
      (w) => /^-[a-z]{2,}$/.test(w) && w.slice(1, -1).split("").some(valued),
    );
    fc.pre(!unreachable && !grouped);

    // Act
    const [byUsage, byGunshi] = [await viaUsage(c, spec), await viaGunshi(c)];

    // Assert
    expect({ c, byUsage, byGunshi, same: same(byUsage, byGunshi) }).toMatchObject({ same: true });
  });

  // Act
  const run = fc.assert(property, { numRuns: 300 });

  // Assert
  await expect(run).resolves.toBeUndefined();
});
