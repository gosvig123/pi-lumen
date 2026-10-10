# Pi Lumen Review

Local Pi extension for interactive [Lumen](https://github.com/jnsahaj/lumen) code review. It launches the `lumen-pi` fork, shows GitHub PR intent inside the viewer, and returns annotations to the originating Pi thread or editor.

## Prerequisites

- [Pi](https://github.com/badlogic/pi-mono)
- Custom `lumen-pi` binary at `${PI_CODING_AGENT_DIR:-~/.pi/agent}/bin/lumen-pi`
- [GitHub CLI](https://cli.github.com/) (`gh`), installed and authenticated

```sh
cd ~/.pi/agent/local/lumen-pi
cargo build --release --no-default-features
cp target/release/lumen ~/.pi/agent/bin/lumen-pi
gh auth login
```

The `--no-default-features` build supports Git and avoids the optional Jujutsu dependency's newer Rust requirement.

## Install

```sh
cd ~/.pi/agent/local/pi-lumen
bun install --frozen-lockfile
pi install ~/.pi/agent/local/pi-lumen
```

Try without installing:

```sh
pi -e ~/.pi/agent/local/pi-lumen
```

## Usage

From a GitHub repository in Pi's interactive TUI:

```text
/lumen
```

With no arguments, `/lumen` opens the GitHub pull request for the current branch when one exists. PR selections always use Lumen's GitHub mode so the viewer can show title, description, URL, and base/head branches. Press `p` to reopen the bounded PR intent modal.

If the current branch has no open PR, `/lumen` lists recent open pull requests from the current repository. Use `/lumen --pick` to force the picker:

```text
/lumen --pick
```

Other explicit arguments bypass current-PR detection and are passed to `lumen-pi diff`:

```text
/lumen HEAD~1
/lumen main..feature
/lumen --pr 123
/lumen --detect-pr
/lumen --file src/main.rs --file src/lib.rs
/lumen --watch
/lumen main..feature --stacked
/lumen --focus src/main.rs
/lumen --theme dracula
/lumen --wrap
```

You may include `diff` explicitly; it is not duplicated:

```text
/lumen diff --detect-pr
```

These options are provided by the installed Lumen version, not implemented independently by this extension.

## Annotation workflow

1. Annotate a selection, hunk, or file in Lumen with `i`.
2. Open annotations with `I`.
3. Press `s`, then confirm with `Enter` to return annotations to Pi.
4. Choose **Send to current Pi thread**, **Prefill editor**, or **Cancel**.

When PR metadata is available, returned feedback includes bounded PR intent labeled as untrusted author-provided context.

## Mode support

The PR picker and `lumen diff` are interactive. `/lumen` requires Pi's interactive TUI mode and does not support JSON, print, or other non-interactive workflows.

## Troubleshooting

- **`gh` is missing:** install GitHub CLI and verify with `gh --version`.
- **GitHub authentication fails:** run `gh auth login`, then verify with `gh repo view`.
- **The repository cannot be detected:** run `/lumen` from a GitHub checkout with a configured remote.
- **`lumen-pi` is missing:** build the local fork, copy it to `~/.pi/agent/bin/lumen-pi`, and verify with `lumen-pi --version`.
- **No annotations appear:** create annotations and press `s`, then `Enter`, before closing Lumen.
- **No pull requests appear:** the picker currently lists open pull requests only.

## Development

```sh
bun install
bun run check
```

The check includes typechecking, tests, linting, formatting, and an npm package dry run.
