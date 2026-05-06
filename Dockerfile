FROM node:22.24.0-alpine3.19 AS base
WORKDIR /app
RUN apk update && apk upgrade --no-cache
COPY package*.json ./

FROM base AS deps
RUN npm ci

FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM base AS prod-deps
ENV NODE_ENV=production
RUN npm ci --omit=dev

FROM node:22.24.0-alpine3.19 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node . .

USER node
EXPOSE 5000
CMD ["npm", "start"]
