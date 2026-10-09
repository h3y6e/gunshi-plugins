import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, test } from "vitest";

import { matches, viaGunshi, viaUsage } from "./runner.ts";
import type { Case, Result } from "./runner.ts";

interface Vector extends Case {
  id: string;
  doc: string;
  expect: Result;
  reference?: { diverges: string };
  gunshi?: { diverges: string };
}

const { vectors }: { vectors: Vector[] } = JSON.parse(
  readFileSync(join(import.meta.dirname, "corpus.json"), "utf8"),
);

const dir = mkdtempSync(join(tmpdir(), "gunshi-plugin-usage-corpus-"));

afterAll(() => {
  rmSync(dir, { recursive: true });
});

describe("corpus", () => {
  test("when the corpus loads, every vector id is unique", () => {
    // Arrange
    const ids = vectors.map((v) => v.id);

    // Act
    const unique = new Set(ids);

    // Assert
    expect(unique.size).toBe(ids.length);
  });

  test.each(vectors)(
    "when the $id vector is parsed, usage-lib and gunshi each agree or diverge as labelled",
    async (v) => {
      // Arrange
      const label = (diverges: unknown) => (diverges ? "diverges" : "agrees");
      const spec = join(dir, `${v.id}.usage.kdl`);

      // Act
      const [byUsage, byGunshi] = [await viaUsage(v, spec), await viaGunshi(v)];

      // Assert
      expect({
        reference: label(!matches(byUsage, v.expect)),
        gunshi: label(!matches(byGunshi, v.expect)),
        byUsage,
        byGunshi,
      }).toMatchObject({ reference: label(v.reference), gunshi: label(v.gunshi) });
    },
  );
});
