# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:26.13.1-slim@sha256:abe7e5a82b61a8ef67b315b85497c9e65173387ccf2f4a029248184b8e020be5

FROM ${NODE_IMAGE} AS build
ENV CI=true
WORKDIR /repo
COPY . .
RUN npm install --global "$(node --print 'require("./package.json").packageManager')" \
  && pnpm install --frozen-lockfile \
  && pnpm build \
  && pnpm --filter api deploy --prod /deploy

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
  PORT=3000 \
  WEB_DIST_DIR=/app/web
WORKDIR /app
COPY --from=build /deploy ./
COPY --from=build /repo/apps/web/dist ./web
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "--eval", "fetch(`http://127.0.0.1:${process.env.PORT}/api/health`).then((response) => process.exit(response.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "dist/main.js"]
