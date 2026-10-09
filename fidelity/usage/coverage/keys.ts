export function keysOf(kdl: string): string[] {
  const keys: string[] = [];
  const scopes = ["spec"];
  for (const raw of kdl.split("\n")) {
    const line = raw.replaceAll(/"(?:[^"\\]|\\.)*"/g, '""').trim();
    if (line === "" || line.startsWith("//")) continue;
    if (line === "}") {
      scopes.pop();
      continue;
    }
    const [head = "", inline] = line.split(" { ");
    const name = head.split(" ")[0] ?? "";
    keys.push(`${scopes.at(-1)}.${name}`);
    for (const [, prop] of head.matchAll(/ (\w+)=/g)) keys.push(`${name}.${prop}`);
    if (inline !== undefined) {
      for (const child of inline.replace(/ }$/, "").split("; "))
        keys.push(`${name}.${child.split(" ")[0]}`);
    } else if (head.endsWith(" {")) {
      scopes.push(name);
    }
  }
  return keys;
}
