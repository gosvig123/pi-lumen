import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { diffCommand } from "./command.ts";
import { pickPullRequest, pullRequestDiffCommand } from "./pull-request-picker.ts";
import { GhPullRequestProvider } from "./pull-requests.ts";
import { ReviewFlow } from "./review-flow.ts";

type Command = ReturnType<typeof diffCommand>;

/** Register `/lumen` as a Lumen diff review helper. */
export default function piLumen(pi: ExtensionAPI): void {
  const flow = new ReviewFlow(pi);
  const pullRequests = new GhPullRequestProvider();
  pi.registerCommand("lumen", {
    description: "Open Lumen diff review; choose a diff when no arguments are provided",
    handler: (args, ctx) => handleLumen(args, ctx, flow, pullRequests),
  });
}

async function handleLumen(
  args: string,
  ctx: ExtensionCommandContext,
  flow: ReviewFlow,
  pullRequests: GhPullRequestProvider,
): Promise<void> {
  await ctx.waitForIdle();
  if (ctx.mode !== "tui") return notifyUnsupported(ctx);
  const command = await resolveCommand(args, ctx, pullRequests);
  if (command) await flow.execute(ctx, command);
}

async function resolveCommand(
  args: string,
  ctx: ExtensionCommandContext,
  pullRequests: GhPullRequestProvider,
): Promise<Command | null> {
  const trimmed = args.trim();
  if (trimmed && trimmed !== "--pick") return diffCommand(args);
  return resolveAutomaticCommand(trimmed === "--pick", ctx, pullRequests);
}

async function resolveAutomaticCommand(
  forcePicker: boolean,
  ctx: ExtensionCommandContext,
  pullRequests: GhPullRequestProvider,
): Promise<Command | null> {
  ctx.ui.setStatus("pi-lumen-review", "Loading pull requests…");
  try {
    const current = forcePicker ? null : await pullRequests.currentBranchPullRequest(ctx.cwd);
    return current ? pullRequestDiffCommand(current) : await pickPullRequest(ctx, pullRequests);
  } finally {
    ctx.ui.setStatus("pi-lumen-review", undefined);
  }
}

function notifyUnsupported(ctx: ExtensionCommandContext): void {
  ctx.ui.notify(
    "/lumen requires Pi's interactive TUI mode because the PR picker and lumen diff are interactive.",
    "error",
  );
}
