# @h3y6e/gunshi-plugin-env

[![npm](https://img.shields.io/npm/v/@h3y6e/gunshi-plugin-env?style=flat)](https://npmjs.com/package/@h3y6e/gunshi-plugin-env)
[![JSR](https://jsr.io/badges/@h3y6e/gunshi-plugin-env)](https://jsr.io/@h3y6e/gunshi-plugin-env)

> Fill [gunshi](https://gunshi.dev) flags from environment variables.

## Installation

```sh
# npm
npm install @h3y6e/gunshi-plugin-env

# deno
deno add jsr:@h3y6e/gunshi-plugin-env
```

Requires gunshi 1.x.

## Usage

```ts
import env, { withEnv } from "@h3y6e/gunshi-plugin-env";
import { cli, define } from "gunshi";

const command = define({
  name: "greet",
  args: {
    loud: withEnv({ type: "boolean", description: "Shout" }, "GREET_LOUD"),
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

`withEnv(schema, name)` lets a flag take the value of the variable `name` when the command line does not give it. Other flags never read variables. It works on the global options that plugins add as well.

### Values

As in [usage](https://usage.jdx.dev), a boolean is true only for `1`, `true`, `True`, or `TRUE`. Other types are parsed and validated by gunshi as on the command line, `conflicts` included.

## Limitations

This plugin fills the values just before the command's `run` and puts them only in the context passed to `run`. Before that, gunshi validates arguments with the values from the command line alone, and it passes its own context to the hooks. This leads to the following:

- A `required` flag has to be given on the command line; a variable does not satisfy it. Leave `required` off flags meant to come from variables.
- `onBeforeCommand` and `onAfterCommand` see the values before the variables fill them. Read the filled values in the command's `run`.
- Of other plugins, only the decorators of those listed after env in `plugins` see the filled values. Extensions see only the values before the variables fill them.

## API References

[JSR](https://jsr.io/@h3y6e/gunshi-plugin-env/doc)

## License

[MIT](LICENSE)
