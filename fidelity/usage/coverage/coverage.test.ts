import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { properties, vocabulary } from "./data.ts";
import { baseline, mapping, samples } from "./mapping.ts";

describe("fidelity coverage", () => {
  test("when mise pins a usage version, the vocabulary was extracted from that version", () => {
    // Arrange
    const mise = readFileSync(join(import.meta.dirname, "../../../mise.toml"), "utf8");

    // Act
    const pinned = /^usage = "(.+)"$/m.exec(mise)?.[1];

    // Assert
    expect(vocabulary.usage).toBe(pinned);
  });

  test("when gunshi declares definition properties, every one has a sample", () => {
    // Arrange
    const lib = dirname(fileURLToPath(import.meta.resolve("gunshi")));
    const gunshi = readdirSync(lib)
      .filter((f) => f.endsWith(".d.ts"))
      .map((f) => join(lib, f));

    // Act
    const declared = [...properties(gunshi, ["ArgSchema", "Command", "CliOptions"])];

    // Assert
    expect(declared.sort()).toEqual(Object.keys(samples).sort());
  });

  test("when the samples are generated, every key they produce is in the usage vocabulary", async () => {
    // Arrange
    const keys = new Set(vocabulary.keys);

    // Act
    const produced = [...(await baseline())];
    for (const sample of Object.values(samples)) produced.push(...(await mapping(sample)).keys);

    // Assert
    expect(produced.filter((k) => !keys.has(k))).toEqual([]);
  });
});
