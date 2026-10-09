import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import rust from "@ast-grep/lang-rust";
import { parse, registerDynamicLanguage } from "@ast-grep/napi";

registerDynamicLanguage({ rust });

const root = join(import.meta.dirname, "../../..");
const version = /^usage = "(.+)"$/m.exec(readFileSync(join(root, "mise.toml"), "utf8"))?.[1];
const source = join(mkdtempSync(join(tmpdir(), "usage-")), "usage");
execFileSync("git", [
  "-c",
  "advice.detachedHead=false",
  "clone",
  "-q",
  "--depth",
  "1",
  "--branch",
  `v${version}`,
  "https://github.com/jdx/usage",
  source,
]);
const commit = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();

interface Arm {
  start: number;
  end: number;
  keys: string[];
}

function arms(file: string): Arm[] {
  return parse("rust", readFileSync(file, "utf8"))
    .root()
    .findAll({
      rule: {
        kind: "match_arm",
        has: { field: "pattern", has: { kind: "string_literal", stopBy: "end" } },
        inside: {
          kind: "match_block",
          inside: {
            kind: "match_expression",
            has: { field: "value", any: [{ regex: "^(k|key)$" }, { regex: "\\.name\\(\\)$" }] },
          },
        },
        not: { inside: { kind: "mod_item", stopBy: "end" } },
      },
    })
    .map((m) => {
      const text = m.text();
      return {
        start: m.range().start.line,
        end: m.range().end.line,
        keys: [...text.slice(0, text.indexOf("=>")).matchAll(/"([a-z_]+)"/g)].map(
          (k) => k[1] ?? "",
        ),
      };
    });
}

function vocabulary(): string[] {
  const dir = join(source, "lib/src/spec");
  const keys = new Set<string>();
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".rs"))) {
    const node = name === "mod.rs" ? "spec" : basename(name, ".rs");
    const found = arms(join(dir, name));
    for (const arm of found) {
      const path = found
        .filter((p) => p !== arm && p.start <= arm.start && arm.end <= p.end)
        .sort((a, b) => a.start - b.start)
        .map((p) => p.keys[0]);
      for (const key of arm.keys) keys.add([node, ...path, key].join("."));
    }
  }
  return [...keys].sort();
}

const cobraRenderers: Record<string, { node?: string; paths: string[] }> = {
  renderKDL: { paths: ["spec"] },
  renderCommand: { node: "cmd", paths: ["cmd"] },
  renderFlag: { node: "flag", paths: ["flag"] },
  renderArg: { node: "arg", paths: ["arg"] },
  renderExample: { node: "example", paths: ["spec.example", "cmd.example"] },
};

function cobra(keys: string[]): string[] {
  const go = readFileSync(join(source, "integrations/cobra/kdl.go"), "utf8");
  const carried = new Set<string>();
  for (const [fn, { node, paths }] of Object.entries(cobraRenderers)) {
    const start = go.indexOf(`func ${fn}(`);
    const body = go.slice(start, go.indexOf("\n}\n", start));
    for (const [, key] of body.matchAll(/"(?:%s| )?([a-z_]+)[ ="]/g)) {
      const found =
        key === node ? ["spec", "cmd"].map((p) => `${p}.${key}`) : paths.map((p) => `${p}.${key}`);
      for (const k of found) if (keys.includes(k)) carried.add(k);
    }
  }
  return [...carried].sort();
}

const keys = vocabulary();
writeFileSync(
  join(import.meta.dirname, "vocabulary.json"),
  `${JSON.stringify({ usage: version, commit, keys, cobra: cobra(keys) }, null, 2)}\n`,
);
