import { homedir } from "node:os";
import { join, resolve } from "node:path";
import parseArgsStringToArgv from "string-argv";

export type LumenCommand = {
  program: string;
  args: string[];
  display: string;
};

export function lumenBinaryPath(agentDir = process.env.PI_CODING_AGENT_DIR): string {
  const root = agentDir ?? join(homedir(), ".pi", "agent");
  return resolve(root, "bin", "lumen-pi");
}

/** Build the only command this package supports: `lumen diff ...`. */
export function diffCommand(input: string): LumenCommand {
  const args = parseArgsStringToArgv(input.trim());
  if (args[0] === "diff") args.shift();

  const fullArgs = ["diff", ...args];
  return { program: lumenBinaryPath(), args: fullArgs, display: `lumen-pi ${fullArgs.join(" ")}` };
}
