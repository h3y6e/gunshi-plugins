import { cli, define } from "gunshi";
import { afterEach, describe, expect, test, vi } from "vitest";

import env, { pluginId } from "./index.ts";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const command = define({
  name: "greet",
  args: {
    loud: { type: "boolean" },
    dryRun: { type: "boolean" },
    times: { type: "number" },
    mode: { type: "enum", choices: ["fast", "safe"] },
    tag: { type: "string", multiple: true },
    from: { type: "string", conflicts: "to" },
    to: { type: "string" },
    token: { type: "string", required: true },
    target: { type: "positional", required: false },
  },
  run: (c) => console.log(JSON.stringify(c.values)),
});

async function run(argv: string[], variables: Record<string, string>): Promise<unknown> {
  for (const [name, value] of Object.entries(variables)) vi.stubEnv(name, value);
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  await cli(argv, command, {
    name: "greet",
    renderHeader: null,
    renderValidationErrors: null,
    plugins: [env()],
  });
  return JSON.parse(String(log.mock.calls[0]?.[0]));
}

describe("env", () => {
  test.each<{ variables: Record<string, string>; values: unknown }>([
    { variables: { GREET_LOUD: "1" }, values: { loud: true } },
    { variables: { GREET_LOUD: "TRUE" }, values: { loud: true } },
    { variables: { GREET_LOUD: "yes" }, values: { loud: false } },
    { variables: { GREET_DRY_RUN: "true" }, values: { dryRun: true } },
    { variables: { GREET_TIMES: "3" }, values: { times: 3 } },
    { variables: { GREET_TAG: "a,b" }, values: { tag: ["a,b"] } },
    { variables: { GREET_TARGET: "world" }, values: {} },
  ])("when $variables is set, the command receives $values", async ({ variables, values }) => {
    // Arrange
    const argv = ["--token", "t"];

    // Act
    const received = await run(argv, variables);

    // Assert
    expect(received).toEqual({ token: "t", ...(values as object) });
  });

  test("when a flag is given on the command line, it wins over its variable", async () => {
    // Arrange
    const variables = { GREET_TIMES: "3" };

    // Act
    const received = await run(["--token", "t", "--times", "5"], variables);

    // Assert
    expect(received).toMatchObject({ times: 5 });
  });

  test.each<{ variables: Record<string, string>; code: string }>([
    { variables: { GREET_TIMES: "many" }, code: "err:arg:invalid-type" },
    { variables: { GREET_MODE: "turbo" }, code: "err:arg:invalid-choice" },
  ])(
    "when $variables is invalid, running the command rejects with gunshi's $code error, which does not contain the value",
    async ({ variables, code }) => {
      // Arrange
      const value = Object.values(variables)[0] ?? "";

      // Act
      const error: unknown = await run(["--token", "t"], variables).catch((e: unknown) => e);

      // Assert
      expect(error).toMatchObject({ errors: [{ code }] });
      expect((error as AggregateError).errors[0].message).not.toContain(value);
    },
  );

  test("when a variable fills a flag that conflicts with a given one, running the command rejects with gunshi's conflict error", async () => {
    // Arrange
    const variables = { GREET_FROM: "a" };

    // Act
    const error: unknown = await run(["--token", "t", "--to", "b"], variables).catch(
      (e: unknown) => e,
    );

    // Assert
    expect(error).toMatchObject({ errors: [{ code: "err:arg:conflict" }] });
  });

  test("when a required flag is only set in its variable, gunshi still requires it on the command line", async () => {
    // Arrange
    const variables = { GREET_TOKEN: "t" };

    // Act
    const error: unknown = await run([], variables).catch((e: unknown) => e);

    // Assert
    expect(error).toMatchObject({ errors: [{ code: "err:arg:required-option" }] });
  });

  test.each([
    { cli: "my-cli", key: "dryRun", variable: "MY_CLI_DRY_RUN" },
    { cli: "greet", key: "outputURL", variable: "GREET_OUTPUT_URL" },
    { cli: "MyCLI", key: "userID", variable: "MY_CLI_USER_ID" },
  ])(
    "when a command of $cli reads the extension for $key, it gets $variable",
    async ({ cli: name, key, variable }) => {
      // Arrange
      const names: string[] = [];
      const named = define({
        name,
        run: (c) =>
          void names.push(
            (c.extensions as Record<string, { name: (k: string) => string }>)[pluginId]?.name(
              key,
            ) ?? "",
          ),
      });

      // Act
      await cli([], named, { name, renderHeader: null, plugins: [env()] });

      // Assert
      expect(names).toEqual([variable]);
    },
  );

  test("when a variable fills a flag that conflicts with a positional given on the command line, running the command rejects with gunshi's conflict error", async () => {
    // Arrange
    vi.stubEnv("GREET_FROM", "a");
    const conflicting = define({
      name: "greet",
      args: {
        from: { type: "string", conflicts: "target" },
        target: { type: "positional", required: false },
      },
      run: () => {},
    });

    // Act
    const running = cli(["x"], conflicting, {
      name: "greet",
      renderHeader: null,
      renderValidationErrors: null,
      plugins: [env()],
    });

    // Assert
    await expect(running).rejects.toMatchObject({ errors: [{ code: "err:arg:conflict" }] });
  });

  test("when a command declares its own version flag, its variable fills it", async () => {
    // Arrange
    vi.stubEnv("GREET_VERSION", "9.9.9");
    const versioned = define({
      name: "greet",
      args: { version: { type: "string" } },
      run: (c) => console.log(JSON.stringify(c.values)),
    });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    // Act
    await cli([], versioned, {
      name: "greet",
      version: "1.0.0",
      renderHeader: null,
      plugins: [env()],
    });

    // Assert
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toEqual({ version: "9.9.9" });
  });

  test("when the CLI has no name, running it rejects because the variables cannot be named", async () => {
    // Arrange
    const unnamed = define({ run: () => {} });

    // Act
    const run = cli([], unnamed, { renderHeader: null, plugins: [env()] });

    // Assert
    await expect(run).rejects.toThrow("give cli() a name");
  });
});
