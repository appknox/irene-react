FROM node:24.22.1-bookworm AS builder

WORKDIR /code/

COPY . ./

# Corepack takes the pnpm version from package.json; the prompt would hang the build.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && pnpm install --frozen-lockfile

# The Ember app is deliberately outside the pnpm workspace and installs its own way.
RUN cd apps/irene && npm ci

RUN pnpm build:all

# Merges both dists, bakes the ledger and adds the server. The same script backs
# `pnpm build:bundle`, so what runs here is what runs locally.
RUN node scripts/build-bundle.ts /code/bundle


FROM node:24.22.1-alpine

LABEL maintainer "Appknox <engineering@appknox.com>"

EXPOSE 4200

RUN mkdir /app && chown node -R /app
USER node
WORKDIR /app/

COPY --chown=node --from=builder /code/bundle/package*.json ./
RUN npm ci --omit=dev

COPY --chown=node --from=builder /code/bundle/. ./

CMD ["node", "/app/index.js"]
