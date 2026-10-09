import usage from "@h3y6e/gunshi-plugin-usage";
import { cli } from "gunshi";

type Options = NonNullable<Parameters<typeof cli>[2]>;

export async function specOf(entry: Parameters<typeof cli>[1], options: Options): Promise<string> {
  const lines: string[] = [];
  const log = console.log;
  console.log = (...data: unknown[]) => void lines.push(data.join(" "));
  try {
    await cli(["usage"], entry, { ...options, plugins: [...(options.plugins ?? []), usage()] });
  } finally {
    console.log = log;
  }
  return lines.join("\n");
}
