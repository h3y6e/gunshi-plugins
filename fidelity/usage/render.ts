import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { vocabulary } from "./coverage/data.ts";
import { baseline, mapping, samples } from "./coverage/mapping.ts";
import type { Mapping } from "./coverage/mapping.ts";

function fill(path: string, blocks: Record<string, string>) {
  let text = readFileSync(path, "utf8");
  for (const [name, content] of Object.entries(blocks)) {
    const block = new RegExp(`(<!-- BEGIN ${name} -->)[\\s\\S]*?(<!-- END ${name} -->)`);
    if (!block.test(text)) throw new Error(`${path} has no ${name} block`);
    text = text.replace(block, (_, begin: string, end: string) => `${begin}\n${content}\n${end}`);
  }
  writeFileSync(path, text);
}

const code = (s: string) => `\`${s}\``;
const source = `https://github.com/jdx/usage/blob/${vocabulary.commit}`;

const base = await baseline();
const mapped: [string, Mapping][] = [];
for (const [name, sample] of Object.entries(samples)) mapped.push([name, await mapping(sample)]);
const carried = new Set([...base, ...mapped.flatMap(([, m]) => m.keys)]);
const count = vocabulary.keys.filter((k) => carried.has(k)).length;
const total = vocabulary.keys.length;

const corpus: { vectors: { argv: string[]; doc: string; gunshi?: { diverges: string } }[] } =
  JSON.parse(readFileSync(join(import.meta.dirname, "behavior/corpus.json"), "utf8"));

fill(join(import.meta.dirname, "coverage/README.md"), {
  base: base.map(code).join(", "),
  properties: [
    `| Property | Key |`,
    "| --- | --- |",
    ...mapped.map(([name, m]) => {
      const keys =
        m.keys.length > 0 ? m.keys.map(code).join(", ") : m.spelling ? "spelling only" : "—";
      return `| ${code(name)} | ${keys} |`;
    }),
  ].join("\n"),
  keys: [
    `[usage ${vocabulary.usage}](${source}/lib/src/spec) · [cobra_usage](${source}/integrations/cobra/kdl.go)`,
    "",
    `| Key | gunshi-plugin-usage (${count}/${total}) | cobra_usage (${vocabulary.cobra.length}/${total}) |`,
    "| --- | --- | --- |",
    ...vocabulary.keys.map(
      (k) =>
        `| ${code(k)} | ${carried.has(k) ? "carried" : "—"} | ${vocabulary.cobra.includes(k) ? "carried" : "—"} |`,
    ),
  ].join("\n"),
});
fill(join(import.meta.dirname, "behavior/README.md"), {
  corpus: [
    "| argv | usage | gunshi |",
    "| --- | --- | --- |",
    ...corpus.vectors.flatMap((v) =>
      v.gunshi ? [`| ${code(v.argv.join(" "))} | ${v.doc} | ${v.gunshi.diverges} |`] : [],
    ),
  ].join("\n"),
});
