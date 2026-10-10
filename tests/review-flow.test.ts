import { describe, expect, test } from "bun:test";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { diffCommand } from "../src/command.ts";
import type { GhPullRequestContextProvider } from "../src/pr-context.ts";
import { ReviewFlow } from "../src/review-flow.ts";
import type { LumenRunner } from "../src/runner.ts";

const annotations = "src/auth.ts line 10 (RIGHT)\nAvoid the race.";

function runner(): LumenRunner {
  return { run: async () => ({ code: 0, stdout: annotations }) } as unknown as LumenRunner;
}

function contexts(): GhPullRequestContextProvider {
  return { resolve: async () => null } as unknown as GhPullRequestContextProvider;
}

function commandContext(choice: string, prefilled: string[]): ExtensionCommandContext {
  return {
    cwd: "/repo",
    ui: {
      select: async () => choice,
      setEditorText: (value: string) => prefilled.push(value),
      notify: () => {},
    },
  } as unknown as ExtensionCommandContext;
}

describe("ReviewFlow", () => {
  test("sends feedback only after explicit send choice", async () => {
    const sent: string[] = [];
    const pi = { sendUserMessage: (value: string) => sent.push(value) } as unknown as ExtensionAPI;
    const flow = new ReviewFlow(pi, runner(), contexts());
    await flow.execute(commandContext("Send to current Pi thread", []), diffCommand("HEAD"));
    expect(sent).toEqual([annotations]);
  });

  test("prefills instead of sending when selected", async () => {
    const sent: string[] = [];
    const prefilled: string[] = [];
    const pi = { sendUserMessage: (value: string) => sent.push(value) } as unknown as ExtensionAPI;
    const flow = new ReviewFlow(pi, runner(), contexts());
    await flow.execute(commandContext("Prefill editor", prefilled), diffCommand("HEAD"));
    expect(prefilled).toEqual([annotations]);
    expect(sent).toEqual([]);
  });

  test("does nothing when delivery is cancelled", async () => {
    const sent: string[] = [];
    const prefilled: string[] = [];
    const pi = { sendUserMessage: (value: string) => sent.push(value) } as unknown as ExtensionAPI;
    const flow = new ReviewFlow(pi, runner(), contexts());
    await flow.execute(commandContext("Cancel", prefilled), diffCommand("HEAD"));
    expect(prefilled).toEqual([]);
    expect(sent).toEqual([]);
  });
});
