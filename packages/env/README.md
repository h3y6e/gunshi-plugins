# @h3y6e/gunshi-plugin-env

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
import env, { pluginId } from "@h3y6e/gunshi-plugin-env";
import type { EnvExtension, PluginId } from "@h3y6e/gunshi-plugin-env";
import { cli, defineWithTypes } from "gunshi";

const command = defineWithTypes<{ extensions: Record<PluginId, EnvExtension> }>()({
  name: "greet",
  args: {
    loud: { type: "boolean", description: "Shout" },
  },
  run: (ctx) => {
    if (ctx.values.loud) return console.log("HELLO!");
    console.log(`hello (${ctx.extensions[pluginId].name("loud")}=1 to shout)`);
  },
});

await cli(process.argv.slice(2), command, { name: "greet", plugins: [env()] });
```

```sh
greet               # hello (GREET_LOUD=1 to shout)
greet --loud        # HELLO!
GREET_LOUD=1 greet  # HELLO!
```

## Features

### Variable names

A flag not given on the command line takes `<CLI>_<FLAG>` in upper snake case: `--dry-run` of `greet` reads `GREET_DRY_RUN`. Positionals, `--help`, and `--version` are not filled.

### Values

As in [usage](https://usage.jdx.dev), a boolean is true only for `1`, `true`, `True`, or `TRUE`. Other types are parsed and validated by gunshi as on the command line, `conflicts` included.

### Context extension

`ctx.extensions[pluginId].name(key)` returns the variable of a flag.

## Limitations

This plugin fills the values just before the command's `run` and puts them only in the context passed to `run`. Before that, gunshi validates arguments with the values from the command line alone, and it passes its own context to the hooks. This leads to the following:

- A `required` flag has to be given on the command line; a variable does not satisfy it. Leave `required` off flags meant to come from variables.
- `onBeforeCommand` and `onAfterCommand` see the values before the variables fill them. Read the filled values in the command's `run`.
- Of other plugins, only the decorators of those listed after env in `plugins` see the filled values. Extensions see only the values before the variables fill them.

## API References

[JSR](https://jsr.io/@h3y6e/gunshi-plugin-env/doc)

## License

[MIT](LICENSE)
