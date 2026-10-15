# Habbodan Wired Portal

A web portal for the [Habbo Wired Variables API](https://www.habbo.com/api/public/api-docs/#/Wired%20Variables), running at [wired.habbodan.com](https://wired.habbodan.com).

Bring the read and write keys from your room's Web API add-on and you can list variables, browse and edit values, inspect user, furni and global profiles, and run bulk deletes, from any hotel.

The interface is available in English, Turkish, German, Spanish, Finnish, French, Italian, Dutch and Brazilian Portuguese, matching the Habbo hotels. Visitors from Turkey get Turkish by default and everyone else gets English. Anyone can switch language from the menu.

## How it works

- **Requests go straight to the hotel.** The browser talks to `habbo.*/api/public` directly. A client-side limiter keeps every room within the documented rate limits.
- **Signing in is optional.** Guests keep their workspaces in the browser. Keys stay in `sessionStorage` unless "remember on this device" is ticked.
- **Habbodan accounts** sign in with OAuth (authorization code + PKCE). Signed-in users can save workspaces, pins and activity to their account. Saved keys are encrypted with AES-256-GCM, and each value is bound to its owner and workspace.

## Stack

React 19, Vite, Tailwind CSS 4, TanStack Query on the client. Express 5, Prisma 7 and MySQL on the server. TypeScript throughout, with shared validation in `shared/`.

```
client/   React app
server/   Express API, OAuth client, sessions, workspace storage
shared/   hotels and schemas used by both sides
prisma/   schema and migrations
```

## Getting started

Requirements: Node 22+ and a MySQL or MariaDB database.

```bash
npm install
cp .env.example .env    # fill in the secrets
npx prisma migrate deploy
npm run dev
```

The client runs on http://localhost:5173 and proxies `/api` and `/auth` to the server on port 3000.

### Signing in with Habbodan

Sign-in needs an OAuth client registered on habbodan.com. Run this from the habbodan repository:

```bash
node server/scripts/create-oauth-client.js --id wired --name "Habbodan Wired Portal" \
  --redirect https://wired.habbodan.com/auth/callback \
  --redirect http://localhost:5173/auth/callback
```

The script prints the client secret once. Put it in `HABBODAN_OAUTH_CLIENT_SECRET`. Guest mode works without any of this.

| Command             | What it does                     |
| ------------------- | -------------------------------- |
| `npm run dev`       | client and server in watch mode  |
| `npm run build`     | production build into `dist/`    |
| `npm start`         | serve the production build       |
| `npm test`          | unit and API tests               |
| `npm run lint`      | ESLint                           |
| `npm run typecheck` | TypeScript for client and server |

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first. Security problems go through [SECURITY.md](SECURITY.md), not public issues.

## License

[MIT](LICENSE). Habbodan is a fan site and is not affiliated with, endorsed, sponsored or approved by Sulake.
