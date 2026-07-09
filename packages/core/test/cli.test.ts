import { describe, expect, it } from "vitest";
import { type CommandContext, run } from "../src/cli.js";

/** Run the router with argv and return the context the command received. */
async function capture(argv: string[], booleanFlags?: readonly string[]): Promise<CommandContext> {
  let received: CommandContext | undefined;
  await run(
    {
      name: "t",
      description: "test",
      booleanFlags,
      commands: [
        {
          name: "cmd",
          summary: "",
          run(ctx) {
            received = ctx;
          },
        },
      ],
    },
    ["cmd", ...argv],
  );
  if (!received) throw new Error("command did not run");
  return received;
}

describe("cli router flag parsing", () => {
  it("value flags consume the next token", async () => {
    const { args, flags } = await capture(["--output", "500", "hello"]);
    expect(flags.output).toBe("500");
    expect(args).toEqual(["hello"]);
  });

  it("boolean flags do NOT swallow the following positional (flag-before-text)", async () => {
    const { args, flags } = await capture(["--json", "hello world"], ["json"]);
    expect(flags.json).toBe(true);
    expect(args).toEqual(["hello world"]);
  });

  it("json and help are always boolean without being declared", async () => {
    const { args, flags } = await capture(["--json", "some text"]);
    expect(flags.json).toBe(true);
    expect(args).toEqual(["some text"]);
  });

  it("a value flag with no value (followed by another flag) parses as boolean true", async () => {
    const { flags } = await capture(["--file", "--json"], ["json"]);
    expect(flags.file).toBe(true);
    expect(flags.json).toBe(true);
  });

  it("a trailing value flag with no value parses as boolean true", async () => {
    const { flags } = await capture(["--file"]);
    expect(flags.file).toBe(true);
  });
});
