FROM node:24.22.1-bookworm AS builder

LABEL maintainer "Appknox <engineering@appknox.com>"

WORKDIR /code/

COPY . ./

# Corepack takes the pnpm version from package.json; the prompt would hang the build.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && pnpm install --frozen-lockfile

# The Ember app is deliberately outside the pnpm workspace and installs its own way.
RUN cd apps/irene && npm ci

# Builds the React app, stages the embed into the Ember app, then builds that.
RUN pnpm build:all

# Both apps share one directory: their asset names never collide, and the only
# document that does is the entry, so the Ember app's is kept beside the React
# app's for the server to choose between.
RUN mkdir -p /code/bundle/dist \
  && cp -R apps/irene/dist/. /code/bundle/dist/ \
  && mv /code/bundle/dist/index.html /code/bundle/dist/ember.html \
  && cp -R apps/dashboard/dist/. /code/bundle/dist/ \
  && rm -rf /code/bundle/dist/tests /code/bundle/dist/testem.js /code/bundle/dist/runtimeconfig.js

# The server reads it to decide which app answers a URL.
RUN node apps/dashboard/scripts/write-ember-paths.ts /code/bundle/ember-owned-paths.json

RUN cp -R staticserver/. /code/bundle/


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
