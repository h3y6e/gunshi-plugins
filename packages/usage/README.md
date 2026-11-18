# @h3y6e/gunshi-plugin-usage

[![npm](https://img.shields.io/npm/v/@h3y6e/gunshi-plugin-usage?style=flat)](https://npmjs.com/package/@h3y6e/gunshi-plugin-usage)
[![JSR](https://jsr.io/badges/@h3y6e/gunshi-plugin-usage)](https://jsr.io/@h3y6e/gunshi-plugin-usage)

> Export a [usage](https://usage.jdx.dev) spec from a [gunshi](https://gunshi.dev) CLI.

Use the spec to generate shell completions, Markdown documentation, man pages, and SDKs with the [usage CLI](https://usage.jdx.dev/cli/).

## Installation

```sh
# npm
npm install @h3y6e/gunshi-plugin-usage

# deno
deno add jsr:@h3y6e/gunshi-plugin-usage
```

Requires gunshi 1.x.

## Usage

```ts
import usage from "@h3y6e/gunshi-plugin-usage";
import { cli, define } from "gunshi";

const command = define({
  name: "greet",
  args: {
    name: { type: "positional", description: "Who to greet" },
  },
  run: (ctx) => console.log(`Hello, ${ctx.values.name}!`),
});

await cli(process.argv.slice(2), command, {
  name: "greet",
  version: "1.0.0",
  description: "Greet someone",
  plugins: [usage()],
});
```

With the CLI and the usage CLI on `PATH`:

```sh
greet usage > greet.usage.kdl
usage generate markdown --file greet.usage.kdl --out-file reference.md
usage generate completion zsh greet --usage-cmd "greet usage" --install
```

## Features

### Spec export

`usage()` adds a hidden `usage` command that prints the spec. The spec includes the global options and commands that other plugins add.

### Environment variables

With [`@h3y6e/gunshi-plugin-env`](https://jsr.io/@h3y6e/gunshi-plugin-env), a flag marked with `withEnv` names its variable in the spec.

### Metadata

What gunshi does not know goes on the definitions:

```ts
import usage, { complete, withUsage } from "@h3y6e/gunshi-plugin-usage";
import { define } from "gunshi";

const write = { dryRun: { type: "boolean", description: "Change nothing" } } as const;

const add = withUsage(
  define({
    name: "add",
    toKebab: true,
    args: {
      file: complete({ type: "positional" }, "file:json"),
      budget: { type: "number", metavar: "tokens" },
      source: { type: "string", choices: ["cli", "chat"] },
      ...write,
    },
    run: () => {},
  }),
  {
    effect: "write",
    longDescription: "Shown under --help",
    outputs: { json: { mediaType: "application/json", framing: "json", select: "json" } },
    exitCodes: { 2: "misuse" },
  },
);

usage({ name: "App", description: "Print the spec", flagsets: { write }, declaredOnly: true });
```

- `withUsage(command, meta)` gives a command `effect`, `long_help`, `subcommand_required`, `output`, and `exit_code`. On the entry command, `longDescription`, `outputs`, and `exitCodes` apply to the whole CLI.
- `complete(schema, type)` sets how shells complete a value.
- `metavar` names a flag's value.
- `choices` on a type other than `enum` become `choices strict=#false`, since gunshi does not check them.
- `flagsets` in the options turn the flags of a set into `use` in every command whose `args` hold all of the set's schemas, as spread from the same object.
- `declaredOnly` states only what the definitions declare: the spec leaves out gunshi's `--help` and `--version`, extra positionals, and `--flag=true`, and states global options once with `global=#true`. Use it to compare the spec with a hand-written one by `usage diff`.

## Limitations

- gunshi and usage read a few command lines differently, and the spec cannot express the difference. For example, with `-a` taking a value and `-d` a boolean, usage reads `-ad p` as `-a p -d`, while gunshi fails because `-a` has no value.
- Without `declaredOnly`, the spec assumes gunshi's `strict` mode. Without `strict`, gunshi drops an unknown flag together with the word after it, which the spec cannot express.
- Examples given as a function are left out of the spec. The function needs the context of its own command, which the `usage` command does not have.

## API References

[JSR](https://jsr.io/@h3y6e/gunshi-plugin-usage/doc)

## License

[MIT](LICENSE)
