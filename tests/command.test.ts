import { describe, expect, test } from "bun:test";
import { isAbsolute } from "node:path";
import { diffCommand, lumenBinaryPath } from "../src/command.ts";

describe("diffCommand", () => {
  test("empty input produces the base lumen diff command", () => {
    expect(diffCommand("")).toMatchObject({
      args: ["diff"],
      display: "lumen-pi diff",
    });
  });

  test("uses an absolute binary path without relying on PATH", () => {
    expect(isAbsolute(diffCommand("").program)).toBeTrue();
    expect(lumenBinaryPath("/custom/agent")).toBe("/custom/agent/bin/lumen-pi");
  });

  test("input already beginning with diff does not duplicate it", () => {
    expect(diffCommand("diff --detect-pr").args).toEqual(["diff", "--detect-pr"]);
  });

  test("quoted arguments are preserved as one arg", () => {
    expect(diffCommand('--file "src/review-flow.ts"').args).toEqual([
      "diff",
      "--file",
      "src/review-flow.ts",
    ]);
  });

  test("PR-style input is forwarded after diff", () => {
    expect(diffCommand("--pr 1").args).toEqual(["diff", "--pr", "1"]);
  });
});
