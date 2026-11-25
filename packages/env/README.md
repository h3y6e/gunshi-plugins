# @h3y6e/gunshi-plugin-env

[![npm](https://img.shields.io/npm/v/@h3y6e/gunshi-plugin-env?style=flat)](https://npmjs.com/package/@h3y6e/gunshi-plugin-env)

> Fill [gunshi](https://gunshi.dev) flags from environment variables.

## Installation

```sh
npm install @h3y6e/gunshi-plugin-env
```

Requires gunshi 1.0.0-rc.13 or later.

## Usage

```ts
import env from "@h3y6e/gunshi-plugin-env";
import { cli, define } from "gunshi";

const command = define({
  name: "greet",
  args: {
    loud: { type: "boolean", description: "Shout", env: "GREET_LOUD" },
  },
  run: (ctx) => console.log(ctx.values.loud ? "HELLO!" : "hello"),
});

await cli(process.argv.slice(2), command, { name: "greet", plugins: [env()] });
```

```sh
greet               # hello
greet --loud        # HELLO!
GREET_LOUD=1 greet  # HELLO!
```

## Features

### Variables

`env: name` on a flag lets it take the value of the variable `name` when the command line does not give it. Other flags never read variables, and `env` on a positional argument fails the command. It works on the global options that plugins add as well.

### Values

As in [usage](https://usage.jdx.dev), a boolean is true only for `1`, `true`, `True`, or `TRUE`. Other types are parsed and validated by gunshi as on the command line, `conflicts` included.

## Limitations

This plugin fills the values and adds the errors in `onExtension`, while gunshi builds the command context, so the hooks and gunshi's reporting of validation errors, `--json` included, treat them as values from the command line. gunshi types that context as read-only and does not promise it can still be changed there; if a later version freezes it earlier, the plugin throws a `TypeError` rather than silently skipping the variables. Beyond that:

- A `required` flag has to be given on the command line; a variable does not satisfy it, because gunshi checks it before building the context. Leave `required` off flags meant to come from variables.
- The extensions of plugins listed before env in `plugins` are created before the variables fill the values.

## License

[MIT](LICENSE)
