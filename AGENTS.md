# Agent Instructions

## Documentation Language

All project documentation must be written in English. This includes `AGENTS.md`, `PROJECT.md`, `TODO.md`, README files, guides, and any documentation added or updated during development.

## Project Memory

Use `PROJECT.md` at the repository root as the project's persistent memory. Read it at the start of each session and before resuming work to recover context without having to investigate everything again.

Update `PROJECT.md` whenever you learn important, lasting information, including:

- Project goals and constraints.
- Decisions and the reasons behind them.
- Essential architecture and behavior.
- Significant completed milestones, problems encountered, and their solutions.
- Current work and the context needed to resume it.

Keep this memory concise, structured, and current. Summarize useful facts instead of copying conversations or execution logs. Correct outdated information and avoid duplication. Never store secrets or sensitive credentials.

If `PROJECT.md` is empty or incomplete, enrich it progressively with information verified during the work. Distinguish confirmed facts from assumptions, and check the code for details that may have changed. The user's current instructions take precedence.

Use `TODO.md` for actionable tasks and `PROJECT.md` for lasting context and useful history. Avoid maintaining the same task list in both files.
