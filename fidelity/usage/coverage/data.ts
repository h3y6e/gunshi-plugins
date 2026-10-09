import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Lang, parse } from "@ast-grep/napi";

export const vocabulary: { usage: string; commit: string; keys: string[]; cobra: string[] } =
  JSON.parse(readFileSync(join(import.meta.dirname, "vocabulary.json"), "utf8"));

export function properties(files: string[], names: string[]): string[] {
  return names.flatMap((name) => {
    const found = files.flatMap((file) =>
      parse(Lang.TypeScript, readFileSync(file, "utf8"))
        .root()
        .findAll({
          rule: {
            kind: "property_signature",
            inside: {
              kind: "interface_body",
              inside: { kind: "interface_declaration", has: { field: "name", regex: `^${name}$` } },
            },
          },
        }),
    );
    return [...new Set(found.map((m) => `${name}.${m.field("name")?.text()}`))];
  });
}
