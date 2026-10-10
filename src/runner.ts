import { spawnSync } from "node:child_process";
import type { ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { lumenBinaryPath, type LumenCommand } from "./command.ts";

export type LumenResult = { code: number | null; stdout: string; error?: string };

type TuiHandle = { stop(): void; start(): void; requestRender(force?: boolean): void };

/** Runs Lumen as a child process, suspending Pi's TUI when an interactive terminal is available. */
export class LumenRunner {
  /** Execute a Lumen command and capture stdout, which Lumen uses for annotation export. */
  async run(ctx: ExtensionCommandContext, command: LumenCommand): Promise<LumenResult> {
    if (ctx.mode !== "tui") {
      return {
        code: null,
        stdout: "",
        error: "/lumen requires Pi's interactive TUI mode because lumen diff is interactive.",
      };
    }

    return ctx.ui.custom<LumenResult>((tui, _theme, _kb, done) => {
      const result = this.runWithSuspendedTui(tui, ctx.cwd, command);
      done(result);
      return { render: () => [], invalidate: () => {} };
    });
  }

  private runWithSuspendedTui(tui: TuiHandle, cwd: string, command: LumenCommand): LumenResult {
    tui.stop();
    try {
      process.stdout.write("\x1b[2J\x1b[H");
      process.stdout.write(`Running ${command.display}\n`);
      process.stdout.write(
        "Press p for PR intent. Annotate with i, open annotations with I, then press s.\n\n",
      );
      return this.spawnInteractive(cwd, command);
    } finally {
      tui.start();
      tui.requestRender(true);
    }
  }

  private spawnInteractive(cwd: string, command: LumenCommand): LumenResult {
    const result = spawnSync(command.program, command.args, {
      cwd,
      env: process.env,
      stdio: ["inherit", "pipe", "inherit"],
      encoding: "utf8",
    });

    return {
      code: result.status,
      stdout: result.stdout ?? "",
      error: result.error ? this.errorHint(result.error) : undefined,
    };
  }

  private errorHint(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("ENOENT") || message.includes("not found")
      ? `lumen-pi is missing at ${lumenBinaryPath()}. Build the local Lumen fork and copy it into Pi's bin directory.`
      : message;
  }
}
