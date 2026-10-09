import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const cli = fileURLToPath(new URL("cli.ts", import.meta.url));

describe.each([
  { runtime: "node", command: ["node"] },
  { runtime: "bun", command: ["bun"] },
  { runtime: "deno", command: ["deno", "run", "-A"] },
])("the env example on $runtime", ({ command }) => {
  function run(args: string[], env: Record<string, string> = {}) {
    const [bin = "", ...rest] = command;
    return spawnSync(bin, [...rest, cli, ...args], {
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
  }

  test("when the command is quiet, it names the variable that makes it shout", () => {
    // Arrange
    const argv: string[] = [];

    // Act
    const result = run(argv);

    // Assert
    expect(result.stdout, result.stderr).toContain("hello (GREET_LOUD=1 to shout)");
  });

  test("when GREET_LOUD is set and --loud is absent, the command shouts", () => {
    // Arrange
    const env = { GREET_LOUD: "1" };

    // Act
    const result = run([], env);

    // Assert
    expect(result.stdout, result.stderr).toContain("HELLO!");
  });
});

test("when the env package's README.md shows how to use it, its code is this example", () => {
  // Arrange
  const text = readFileSync(new URL(`../../packages/env/README.md`, import.meta.url), "utf8");

  // Act
  const code = /```ts\n([\s\S]*?)```/.exec(text)?.[1];

  // Assert
  expect(code).toBe(readFileSync(cli, "utf8"));
});

test("when the env package's module documentation shows an example, its code is this example", () => {
  // Arrange
  const text = readFileSync(new URL("../../packages/env/src/index.ts", import.meta.url), "utf8");

  // Act
  const block = /\* @example\n([\s\S]*?)\n \*\//.exec(text)?.[1] ?? "";
  const code = block.replaceAll(/^ \*(?: {3})?/gm, "");

  // Assert
  expect(`${code}\n`).toBe(readFileSync(new URL("cli.ts", import.meta.url), "utf8"));
});
