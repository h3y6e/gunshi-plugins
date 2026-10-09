import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const cli = fileURLToPath(new URL("cli.ts", import.meta.url));

describe.each([
  { runtime: "node", command: ["node"] },
  { runtime: "bun", command: ["bun"] },
  { runtime: "deno", command: ["deno", "run", "-A"] },
])("the example with every plugin on $runtime", ({ command }) => {
  function run(args: string[], env: Record<string, string> = {}) {
    const [bin = "", ...rest] = command;
    return spawnSync(bin, [...rest, cli, ...args], {
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
  }

  test("when GREET_LOUD is set, the command shouts", () => {
    // Arrange
    const env = { GREET_LOUD: "1" };

    // Act
    const result = run(["world"], env);

    // Assert
    expect(result.stdout, result.stderr).toContain("HELLO, WORLD!");
  });

  test("when usage explain reads the spec with GREET_LOUD set, it reports that the variable gives the flag", () => {
    // Arrange
    const dir = mkdtempSync(join(tmpdir(), "gunshi-plugins-example-"));
    const spec = join(dir, "greet.usage.kdl");
    writeFileSync(spec, run(["usage"]).stdout);

    // Act
    const explain = spawnSync("usage", ["explain", "-f", spec, "--", "greet", "world"], {
      encoding: "utf8",
      env: { ...process.env, GREET_LOUD: "1" },
    });
    rmSync(dir, { recursive: true });

    // Assert
    expect(explain.stdout, explain.stderr).toMatch(/flag\s+--loud\s+true\s+env GREET_LOUD/);
  });
});

test("when the root README shows how to use the plugins together, its code is this example", () => {
  // Arrange
  const text = readFileSync(new URL("../README.md", import.meta.url), "utf8");

  // Act
  const code = /```ts\n([\s\S]*?)```/.exec(text)?.[1];

  // Assert
  expect(code).toBe(readFileSync(cli, "utf8"));
});
