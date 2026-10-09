# gunshi-plugins

Opinionated plugins for [gunshi](https://gunshi.dev).

| Package                                        | Description                                       |
| ---------------------------------------------- | ------------------------------------------------- |
| [`@h3y6e/gunshi-plugin-env`](packages/env)     | Fills flags from environment variables            |
| [`@h3y6e/gunshi-plugin-usage`](packages/usage) | Exports a [usage](https://usage.jdx.dev) KDL spec |

[fidelity/usage](fidelity/usage) checks how faithfully the usage spec from `@h3y6e/gunshi-plugin-usage` describes a gunshi CLI.

## Usage

```ts
import env from "@h3y6e/gunshi-plugin-env";
import usage from "@h3y6e/gunshi-plugin-usage";
import { cli, define } from "gunshi";

const command = define({
  name: "greet",
  args: {
    name: { type: "positional", description: "Who to greet" },
    loud: { type: "boolean", description: "Shout" },
  },
  run: (ctx) => {
    const greeting = `Hello, ${ctx.values.name}!`;
    console.log(ctx.values.loud ? greeting.toUpperCase() : greeting);
  },
});

await cli(process.argv.slice(2), command, {
  name: "greet",
  version: "1.0.0",
  description: "Greet someone",
  plugins: [env(), usage()],
});
```

`env()` fills `--loud` from `GREET_LOUD`:

```sh
GREET_LOUD=1 greet world  # HELLO, WORLD!
```

`usage()` prints a spec that names the variable, so the [usage CLI](https://usage.jdx.dev/cli/) knows it too:

```sh
greet usage > greet.usage.kdl
GREET_LOUD=1 usage explain -f greet.usage.kdl -- greet world
# ...
# values
#   flag  --loud  true   env GREET_LOUD
#   arg   <name>  world  argv [1]
```
