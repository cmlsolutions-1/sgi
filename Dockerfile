FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Some Next.js dependencies expect glibc
RUN apk add --no-cache libc6-compat

ARG API_URL
ENV API_URL=$API_URL
ARG CSP_DOCUMENT_ORIGINS
ENV CSP_DOCUMENT_ORIGINS=$CSP_DOCUMENT_ORIGINS

FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ARG API_URL
ENV API_URL=$API_URL

COPY package.json package-lock.json .npmrc ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev

COPY next.config.mjs ./next.config.mjs
COPY lib/security-headers.mjs ./lib/security-headers.mjs
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

RUN mkdir -p /app/.next/cache
RUN chown -R node:node /app/.next/cache
USER node

EXPOSE 3000

CMD ["npm", "start"]
