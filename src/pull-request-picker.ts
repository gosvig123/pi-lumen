import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { diffCommand } from "./command.ts";
import type { PullRequest, PullRequestProvider } from "./pull-requests.ts";
import { formatDate } from "./utils/date.ts";

type Command = ReturnType<typeof diffCommand>;

/** Shows recent pull requests and turns the selected one into a Lumen command. */
export async function pickPullRequest(
  ctx: ExtensionCommandContext,
  provider: PullRequestProvider,
): Promise<Command | null> {
  try {
    return await selectPullRequest(ctx, provider);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.ui.notify(`pi-lumen-review: ${message}`, "error");
    return null;
  }
}

async function selectPullRequest(
  ctx: ExtensionCommandContext,
  provider: PullRequestProvider,
): Promise<Command | null> {
  const pullRequests = sortPullRequests(await provider.listRecent(ctx.cwd));
  if (pullRequests.length === 0) return notifyEmpty(ctx);
  const selected = await ctx.ui.select(
    "Select a diff to review",
    pullRequests.map(formatPullRequest),
  );
  if (!selected) return null;
  const pullRequest = pullRequests.find((pr) => formatPullRequest(pr) === selected);
  if (!pullRequest) return notifyMissing(ctx);
  return pullRequestDiffCommand(pullRequest);
}

function sortPullRequests(pullRequests: PullRequest[]): PullRequest[] {
  return pullRequests.sort((a, b) => {
    if (a.isCurrentBranch !== b.isCurrentBranch) return a.isCurrentBranch ? -1 : 1;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

function notifyEmpty(ctx: ExtensionCommandContext): null {
  ctx.ui.notify("No open pull requests found for this repository.", "info");
  return null;
}

function notifyMissing(ctx: ExtensionCommandContext): null {
  ctx.ui.notify("The selected pull request is no longer available.", "error");
  return null;
}

export function pullRequestDiffCommand(pullRequest: PullRequest): Command {
  return diffCommand(`--pr ${pullRequest.url}`);
}

function formatPullRequest(pullRequest: PullRequest): string {
  const current = pullRequest.isCurrentBranch ? "★ " : "";
  const draft = pullRequest.isDraft ? " [draft]" : "";
  const updated = formatDate(pullRequest.updatedAt);
  return `${current}#${pullRequest.number} · ${pullRequest.title} · ${pullRequest.author} · updated ${updated}${draft}`;
}
