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
