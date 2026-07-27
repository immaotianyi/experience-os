# Build the React workbench once, then ship only the Node runtime and static assets.
FROM node:20-bookworm-slim AS web-build
WORKDIR /app
COPY apps/web-react/package.json apps/web-react/package-lock.json ./apps/web-react/
RUN npm --prefix apps/web-react ci
COPY apps/web-react ./apps/web-react
RUN npm --prefix apps/web-react run build

FROM node:20-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY --from=web-build /app/apps/web ./apps/web

ENV NODE_ENV=production \
    EOS_HOST=0.0.0.0 \
    PORT=8080 \
    EOS_DEPLOYMENT_MODE=private_beta \
    EOS_VAULT_DIR=/var/data/vault \
    EOS_VAULT_ARCHIVE_DIR=/var/data/vault-archive

EXPOSE 8080
CMD ["node", "src/webServer.js"]
