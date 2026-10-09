import { cli, define } from "gunshi";
import { afterEach, describe, expect, test, vi } from "vitest";

import usage, { pluginId } from "./index.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

const entry = define({
  name: "greet",
  args: { name: { type: "positional" } },
  run: (c) => console.log(`Hello, ${c.values.name}!`),
});

const options = { name: "greet", version: "1.0.0", plugins: [usage()] };

async function run(argv: string[]): Promise<string> {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  await cli(argv, entry, options);
  return log.mock.calls.map((call) => call.join(" ")).join("\n");
}

describe("usage", () => {
  test("when another word is given, the entry command runs as before", async () => {
    // Arrange
    const argv = ["world"];

    // Act
    const printed = await run(argv);

    // Assert
    expect(printed).toContain("Hello, world!");
  });

  test("when created, the plugin is identified by its namespaced id", () => {
    // Arrange
    const plugin = usage();

    // Act
    const id = plugin.id;

    // Assert
    expect(id).toBe(pluginId);
  });
});
