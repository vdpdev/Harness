# Harness

TypeScript project development harness — boilerplate for agent-native workflows: ticket-first
development, repo health checks, local CI pipeline, agent skills, and automated verification.

## Usage (scaffold a new project)

```bash
npx @vdpdev/harness my-project
cd my-project
corepack enable
pnpm install
pnpm run local:ci:quick
```

## Quick Start (contributing to this repo)

```bash
git clone https://github.com/vdpdev/harness.git
cd harness
corepack enable
pnpm install
pnpm run local:ci:quick
```

## Scripts

| Script                         | What it does                                   |
| ------------------------------ | ---------------------------------------------- |
| `pnpm run build`               | Compile TypeScript                             |
| `pnpm run typecheck`           | Type-check without emitting                    |
| `pnpm run lint`                | Lint all files                                 |
| `pnpm run format`              | Format all files                               |
| `pnpm run format:check`        | Check formatting                               |
| `pnpm test`                    | Run unit tests                                 |
| `pnpm run repo-health`         | Run all health checks                          |
| `pnpm run repo-health:quick`   | Run essential health checks                    |
| `pnpm run local:ci:quick`      | Run full local CI pipeline                     |
| `pnpm run refactor:split`      | Extract functions into per-barrel subdirectory |
| `pnpm run refactor:split:flat` | Extract functions flat alongside barrel        |
| `pnpm run tickets list`        | List open tickets                              |
