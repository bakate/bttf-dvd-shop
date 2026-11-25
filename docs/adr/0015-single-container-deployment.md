# 15. One container serves the API and the frontend

- Status: accepted
- Date: 2026-11-25
- Issue: #8 (parent #1)

## Context

Anyone with Docker must run the whole app with one command, without Node,
and a reviewer must open a live demo. Two deployables (a static host and
an API) would need CORS, two URLs and two deploys kept in step.

## Decision

- One multi-stage `Dockerfile`. The build stage installs the pnpm version
  named by `packageManager` (Node 26 no longer bundles Corepack), builds
  every workspace and runs `pnpm deploy --prod` for the API. The runtime
  stage holds only the compiled API, its production dependencies and the
  built frontend.
- The base image is `node:26.13.1-slim`, pinned by tag and digest. The
  process runs as the image's non-root `node` user, and the files it runs
  are owned by root, so it cannot rewrite them.
- The NestJS app serves the built frontend with `useStaticAssets` when
  `WEB_DIST_DIR` is set. The image sets it, and `pnpm dev` leaves it unset,
  so Vite still serves the frontend in development. The app has one
  screen, so there is no fallback to `index.html` for client routes. The
  same origin serves the page and the API, so CORS stays off.
- Helmet sends one strict Content Security Policy: `'self'` for scripts,
  fonts, images and requests, `'none'` for objects, frames and inline
  script attributes. The bundle has no inline script and the fonts are
  self-hosted (Fontsource), so neither needs `https:` or `data:`.
  `style-src` keeps `'unsafe-inline'`: Mantine writes its CSS variables in
  a `<style>` tag and in `style` attributes, and a nonce cannot cover
  attributes. `upgrade-insecure-requests` is left out: every source is
  same-origin, and Safari would upgrade `http://localhost` and break the
  local container. The API documentation keeps its own, looser policy
  (Scalar loads from a CDN).
- The container health check calls `/api/health` with Node's `fetch`,
  since the slim image has no `curl`.
- `compose.yaml` runs the image locally with `restart: unless-stopped`.
- CI builds the image on every pull request, in the quality gate.
- The demo runs on Render's free plan from the Dockerfile, described by
  `render.yaml` and deployed from `main`.

## Consequences

- One artifact, one URL, no CORS. `CORS_ORIGIN` stays for an API consumer
  on another origin.
- The free plan sleeps after inactivity: the first page load takes about
  30 s, and only the README warning covers it, since the frontend is not
  loaded yet.
- Behind Render's proxy, `req.ip` is the proxy's address, so the rate
  limit is shared by every visitor of the demo. Trusting `X-Forwarded-For`
  needs the exact proxy hop count, and is left until the limit matters.
- `docker build` reinstalls dependencies whenever any file changes. Layer
  caching by manifest is an optimisation for when build time matters.
