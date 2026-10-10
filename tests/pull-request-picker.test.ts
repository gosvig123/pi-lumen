import { describe, expect, test } from "bun:test";
import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { pickPullRequest } from "../src/pull-request-picker.ts";
import type { PullRequest } from "../src/pull-requests.ts";

const pullRequests: PullRequest[] = [
  {
    number: 7,
    title: "Add picker",
    author: "contributor",
    updatedAt: "2026-07-12T10:00:00Z",
    isDraft: false,
    url: "https://github.com/example/repo/pull/7",
    isCurrentBranch: false,
  },
];

function context(selected: string | undefined, notifications: string[]): ExtensionCommandContext {
  return {
    cwd: "/repo",
    ui: {
      select: async () => selected,
      notify: (message: string) => notifications.push(message),
    },
  } as unknown as ExtensionCommandContext;
}

describe("pickPullRequest", () => {
  test("opens selected pull request in Lumen PR mode", async () => {
    const result = await pickPullRequest(
      context("#7 · Add picker · contributor · updated 2026-07-12", []),
      { listRecent: async () => pullRequests },
    );
    expect(result?.args).toEqual(["diff", "--pr", pullRequests[0]!.url]);
  });

  test("keeps current branch pull request first", async () => {
    const current = {
      ...pullRequests[0]!,
      number: 8,
      title: "Current",
      url: "https://github.com/example/repo/pull/8",
      isCurrentBranch: true,
    };
    const result = await pickPullRequest(
      context("★ #8 · Current · contributor · updated 2026-07-12", []),
      { listRecent: async () => [pullRequests[0]!, current] },
    );
    expect(result?.args).toEqual(["diff", "--pr", current.url]);
  });

  test("does not launch when picker is cancelled", async () => {
    const result = await pickPullRequest(context(undefined, []), {
      listRecent: async () => pullRequests,
    });
    expect(result).toBeNull();
  });

  test("notifies when no open pull requests exist", async () => {
    const notifications: string[] = [];
    const result = await pickPullRequest(context(undefined, notifications), {
      listRecent: async () => [],
    });
    expect(result).toBeNull();
    expect(notifications).toEqual(["No open pull requests found for this repository."]);
  });
});
