import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

const file = (name: string) => fileURLToPath(new URL(name, import.meta.url));

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "gunshi-plugin-usage-e2e-"));
});

afterAll(() => {
  rmSync(dir, { recursive: true });
});

describe.each([
  { runtime: "node", command: ["node"] },
  { runtime: "bun", command: ["bun"] },
  { runtime: "deno", command: ["deno", "run", "-A"] },
])("the usage example on $runtime", ({ runtime, command }) => {
  function run(args: string[], env: Record<string, string> = {}) {
    const [bin = "", ...rest] = command;
    return spawnSync(bin, [...rest, file("cli.ts"), ...args], {
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
  }

  test("when a name is given, the command greets it", () => {
    // Arrange
    const argv = ["world"];

    // Act
    const result = run(argv);

    // Assert
    expect(result.stdout, result.stderr).toContain("Hello, world!");
  });

  test("when the usage command runs, it prints a spec that usage lint accepts", () => {
    // Arrange
    const spec = join(dir, `${runtime}.usage.kdl`);

    // Act
    const result = run(["usage"]);

    // Assert
    writeFileSync(spec, result.stdout);
    const lint = spawnSync("usage", ["lint", spec], { encoding: "utf8" });
    expect(lint.status, `${result.stderr}${lint.stdout}${lint.stderr}`).toBe(0);
  });
});

test("when the usage package's README.md shows how to use it, its code is this example", () => {
  // Arrange
  const text = readFileSync(new URL(`../../packages/usage/README.md`, import.meta.url), "utf8");

  // Act
  const code = /```ts\n([\s\S]*?)```/.exec(text)?.[1];

  // Assert
  expect(code).toBe(readFileSync(file("cli.ts"), "utf8"));
});

test("when the usage package's module documentation shows an example, its code is this example", () => {
  // Arrange
  const text = readFileSync(new URL("../../packages/usage/src/index.ts", import.meta.url), "utf8");

  // Act
  const block = /\* @example\n([\s\S]*?)\n \*\//.exec(text)?.[1] ?? "";
  const code = block.replaceAll(/^ \*(?: {3})?/gm, "");

  // Assert
  expect(`${code}\n`).toBe(readFileSync(new URL("cli.ts", import.meta.url), "utf8"));
});
