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
