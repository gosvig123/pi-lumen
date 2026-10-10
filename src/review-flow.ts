import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { countAnnotations, extractAnnotations } from "./annotations.ts";
import type { LumenCommand } from "./command.ts";
import {
  formatReviewFeedback,
  GhPullRequestContextProvider,
  type PullRequestContext,
} from "./pr-context.ts";
import { LumenRunner, type LumenResult } from "./runner.ts";

const SEND = "Send to current Pi thread";
const PREFILL = "Prefill editor";
const CANCEL = "Cancel";

/** Runs Lumen and returns exported annotations through an explicit delivery choice. */
export class ReviewFlow {
  constructor(
    private readonly pi: ExtensionAPI,
    private readonly runner = new LumenRunner(),
    private readonly contexts = new GhPullRequestContextProvider(),
  ) {}

  async execute(ctx: ExtensionCommandContext, command: LumenCommand): Promise<void> {
    const context = await this.contexts.resolve(ctx.cwd, command);
    const result = await this.runner.run(ctx, command);
    if (!this.reportResult(ctx, result)) return;
    const annotations = extractAnnotations(result.stdout);
    if (!annotations) return this.reportEmpty(ctx);
    const feedback = formatReviewFeedback(annotations, context);
    const choice = await ctx.ui.select("Return Lumen feedback", [SEND, PREFILL, CANCEL]);
    this.deliver(ctx, choice, feedback, countAnnotations(annotations), context);
  }

  private reportResult(ctx: ExtensionCommandContext, result: LumenResult): boolean {
    if (result.error) {
      ctx.ui.notify(`pi-lumen-review: ${result.error}`, "error");
      return false;
    }
    if (result.code && result.code !== 0) {
      ctx.ui.notify(`Lumen exited with code ${result.code}`, "warning");
    }
    return true;
  }

  private reportEmpty(ctx: ExtensionCommandContext): void {
    ctx.ui.notify("Lumen review closed with no annotations sent", "info");
  }

  private deliver(
    ctx: ExtensionCommandContext,
    choice: string | undefined,
    feedback: string,
    count: number,
    context: PullRequestContext | null,
  ): void {
    if (choice === SEND) this.pi.sendUserMessage(feedback);
    if (choice === PREFILL) ctx.ui.setEditorText(feedback);
    if (choice !== SEND && choice !== PREFILL) return;
    const target = choice === SEND ? "sent to Pi" : "prefilled";
    const scope = context ? ` for PR #${context.number}` : "";
    ctx.ui.notify(`${count || 1} annotation${count === 1 ? "" : "s"}${scope} ${target}`, "info");
  }
}
