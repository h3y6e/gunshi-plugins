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
