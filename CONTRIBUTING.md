# Contributing

Thanks for helping out. `main` is protected, so every change goes through a pull request.

1. Fork the repository and branch off `main`.
2. Make your change. Keep pull requests focused on one thing.
3. Run `npm run lint`, `npm run typecheck` and `npm test` before you push.
4. Open a pull request that explains what changed and why. Add screenshots for UI changes.

## Guidelines

- TypeScript in strict mode. Validate anything that crosses a trust boundary with the schemas in `shared/`.
- Keep the code self-explanatory and add comments only where the code can't speak for itself.
- New UI text goes into `client/src/i18n/en.ts` and every other locale in that folder. The types and `locales.test.ts` catch missing keys and placeholders.
- Never commit secrets or real Wired keys. Configuration lives in `.env`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:` …).

Pull requests are squash-merged once they're reviewed and CI passes.
