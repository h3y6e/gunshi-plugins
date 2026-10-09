# @h3y6e/gunshi-plugin-usage

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

With [`@h3y6e/gunshi-plugin-env`](https://jsr.io/@h3y6e/gunshi-plugin-env) in `plugins`, each flag in the spec names the variable that fills it.

## Limitations

- gunshi and usage read a few command lines differently, and the spec cannot express the difference. For example, with `-a` taking a value and `-d` a boolean, usage reads `-ad p` as `-a p -d`, while gunshi fails because `-a` has no value.
- The spec assumes gunshi's `strict` mode. Without `strict`, gunshi drops an unknown flag together with the word after it, which the spec cannot express.
- Examples given as a function are left out of the spec. The function needs the context of its own command, which the `usage` command does not have.

## API References

[JSR](https://jsr.io/@h3y6e/gunshi-plugin-usage/doc)

## License

[MIT](LICENSE)
