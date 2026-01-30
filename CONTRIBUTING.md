# Contributing

Thanks for your interest in contributing to PDF Reader.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/pdf-reader.git`
3. Install dependencies: `pnpm install`
4. Start the dev server: `pnpm dev`

## Development

- Run `pnpm check` before committing to ensure code passes linting and formatting (Biome)
- Run `pnpm exec playwright test` to run E2E tests (requires a production build via `pnpm build`)

## Pull Requests

- Keep changes focused — one feature or fix per PR
- Add E2E tests for new user-facing functionality
- Ensure `pnpm check` and `pnpm build` pass
- Write a clear PR description explaining what changed and why

## Reporting Issues

Open an issue with:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
