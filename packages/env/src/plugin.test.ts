import { cli, define, jsonArgs } from "gunshi";
import { plugin } from "gunshi/plugin";
import { afterEach, describe, expect, test, vi } from "vitest";

import env from "./index.ts";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const command = define({
  name: "greet",
  args: {
    loud: { type: "boolean", env: "GREET_LOUD" },
    dryRun: { type: "boolean", env: "GREET_DRY_RUN" },
    times: { type: "number", env: "GREET_TIMES" },
    mode: { type: "enum", choices: ["fast", "safe"], env: "GREET_MODE" },
    tag: { type: "string", multiple: true, env: "GREET_TAG" },
    from: { type: "string", conflicts: "to", env: "GREET_FROM" },
    to: { type: "string" },
    token: { type: "string", required: true, env: "GREET_TOKEN" },
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

  test.each<{ name: string; options: object; argv: string[] }>([
    { name: "text", options: {}, argv: [] },
    { name: "--json", options: {}, argv: ["--json"] },
    { name: "renderValidationErrors: null", options: { renderValidationErrors: null }, argv: [] },
    { name: "usageSilent", options: { usageSilent: true }, argv: [] },
  ])(
    "when a variable is invalid ($name), gunshi reports it exactly as the same value on the command line",
    async ({ options, argv }) => {
      // Arrange
      const times = define({
        name: "greet",
        args: { ...jsonArgs, times: { type: "number", env: "GREET_TIMES" } },
        run: () => ({}),
      });
      const report = async (args: string[]) => {
        const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
        const hook: unknown[] = [];
        const outcome = await cli(args, times, {
          name: "greet",
          validationErrorExitCode: 2,
          onErrorCommand: (_c, error) => void hook.push(error),
          plugins: [env()],
          ...options,
        }).then(
          () => "resolved",
          (error: unknown) => (error instanceof AggregateError ? "rejected" : error),
        );
        const exitCode = process.exitCode;
        process.exitCode = undefined;
        const printed = stderr.mock.calls.map((call) => String(call[0]));
        stderr.mockRestore();
        return { outcome, exitCode, printed, hook: hook.map((e) => e?.constructor.name) };
      };

      // Act
      const fromFlag = await report([...argv, "--times", "many"]);
      vi.stubEnv("GREET_TIMES", "many");
      const fromVariable = await report(argv);

      // Assert
      expect(fromVariable).toEqual(fromFlag);
    },
  );

  test("when a variable fills a flag, onBeforeCommand sees the filled value", async () => {
    // Arrange
    vi.stubEnv("GREET_TIMES", "3");
    const seen: unknown[] = [];
    const times = define({
      name: "greet",
      args: { times: { type: "number", env: "GREET_TIMES" } },
      run: () => {},
    });

    // Act
    await cli([], times, {
      name: "greet",
      onBeforeCommand: (c) => void seen.push(c.values.times),
      plugins: [env()],
    });

    // Assert
    expect(seen).toEqual([3]);
  });

  test.each<{ name: string; argv: string[] }>([
    { name: "two long options", argv: ["--from", "a", "--to", "b"] },
    { name: "a short and a long option", argv: ["-f", "a", "--to", "b"] },
    { name: "an option and a positional", argv: ["--from", "a", "x"] },
  ])(
    "when $name given on the command line conflict, gunshi's conflict error is reported once",
    async ({ argv }) => {
      // Arrange
      const conflicting = define({
        name: "greet",
        args: {
          from: { type: "string", short: "f", conflicts: ["to", "target"], env: "GREET_FROM" },
          to: { type: "string", env: "GREET_TO" },
          target: { type: "positional", required: false },
        },
        run: () => {},
      });

      // Act
      const running = cli(argv, conflicting, {
        name: "greet",
        renderValidationErrors: null,
        plugins: [env()],
      });

      // Assert
      await expect(running).rejects.toMatchObject({ errors: [{ code: "err:arg:conflict" }] });
    },
  );

  test.each<{ name: string; argv: string[] }>([
    { name: "a short option", argv: ["-f", "a"] },
    { name: "a negated option", argv: ["--no-quiet"] },
    { name: "a positional", argv: ["x"] },
  ])(
    "when $name on the command line conflicts with a flag from a variable, the error names it as gunshi does",
    async ({ argv }) => {
      // Arrange
      const conflicting = define({
        name: "greet",
        args: {
          from: { type: "string", short: "f", conflicts: "to" },
          quiet: { type: "boolean", negatable: true, conflicts: "to" },
          to: { type: "string", conflicts: "targetName", env: "GREET_TO" },
          targetName: { type: "positional", required: false, toKebab: true },
        },
        run: () => {},
      });
      const messages = (args: string[]) =>
        cli(args, conflicting, { name: "greet", renderValidationErrors: null, plugins: [env()] })
          .catch((e: AggregateError) => e)
          .then((e) => (e as AggregateError).errors.map((err: Error) => err.message));

      // Act
      const fromFlag = await messages([...argv, "--to", "b"]);
      vi.stubEnv("GREET_TO", "b");
      const fromVariable = await messages(argv);

      // Assert
      expect(fromVariable).toEqual(fromFlag);
    },
  );

  test("when a variable asks for JSON, the command's ctx.log is silenced as with --json", async () => {
    // Arrange
    vi.stubEnv("GREET_JSON", "1");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const greet = define({
      name: "greet",
      args: { ...jsonArgs, json: { ...jsonArgs.json, env: "GREET_JSON" } },
      run: (c) => {
        c.log("hello");
        return { ok: true };
      },
    });

    // Act
    await cli([], greet, { name: "greet", renderHeader: null, plugins: [env()] });

    // Assert
    expect(log.mock.calls.map((call) => String(call[0]))).toEqual(['{"ok":true}']);
  });

  test("when a positional names a variable, running the command fails instead of ignoring it", async () => {
    // Arrange
    const positional = define({
      name: "greet",
      args: { target: { type: "positional", env: "GREET_TARGET" } },
      run: () => {},
    });

    // Act
    const running = cli(["x"], positional, { name: "greet", plugins: [env()] });

    // Assert
    await expect(running).rejects.toThrow(
      "env is only read for flags, not for the positional target",
    );
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
        from: { type: "string", conflicts: "target", env: "GREET_FROM" },
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
      setup: (ctx) => ctx.addGlobalOption("project", { type: "string", env: "APP_PROJECT" }),
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
