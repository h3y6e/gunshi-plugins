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
