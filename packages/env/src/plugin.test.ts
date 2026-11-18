import { cli, define } from "gunshi";
import { plugin } from "gunshi/plugin";
import { afterEach, describe, expect, test, vi } from "vitest";

import env, { withEnv } from "./index.ts";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const command = define({
  name: "greet",
  args: {
    loud: withEnv({ type: "boolean" }, "GREET_LOUD"),
    dryRun: withEnv({ type: "boolean" }, "GREET_DRY_RUN"),
    times: withEnv({ type: "number" }, "GREET_TIMES"),
    mode: withEnv({ type: "enum", choices: ["fast", "safe"] }, "GREET_MODE"),
    tag: withEnv({ type: "string", multiple: true }, "GREET_TAG"),
    from: withEnv({ type: "string", conflicts: "to" }, "GREET_FROM"),
    to: { type: "string" },
    token: withEnv({ type: "string", required: true }, "GREET_TOKEN"),
    plain: { type: "string" },
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
    { variables: { GREET_TARGET: "world", GREET_PLAIN: "p" }, values: {} },
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

  test("when a variable fills a flag that conflicts with a positional given on the command line, running the command rejects with gunshi's conflict error", async () => {
    // Arrange
    vi.stubEnv("GREET_FROM", "a");
    const conflicting = define({
      name: "greet",
      args: {
        from: withEnv({ type: "string", conflicts: "target" }, "GREET_FROM"),
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

  test("when a plugin adds a global option with a variable, the variable fills it in every command", async () => {
    // Arrange
    vi.stubEnv("APP_PROJECT", "web");
    const global = plugin({
      id: "x:global",
      setup: (ctx) => ctx.addGlobalOption("project", withEnv({ type: "string" }, "APP_PROJECT")),
    });
    const show = define({ name: "show", run: (c) => console.log(JSON.stringify(c.values)) });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    // Act
    await cli(["show"], define({ run: () => {} }), {
      name: "app",
      subCommands: { show },
      renderHeader: null,
      plugins: [global, env()],
    });

    // Assert
    expect(JSON.parse(String(log.mock.calls[0]?.[0]))).toMatchObject({ project: "web" });
  });
});
