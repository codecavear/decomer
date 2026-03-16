# Stage 1: Build
FROM node:22-slim AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN npm install

COPY . .
RUN npx nuxt build

# Stage 2: Production
FROM node:22-slim
WORKDIR /app

# Copy build output, migrations, and scripts
COPY --from=build /app/.output .output
COPY --from=build /app/drizzle drizzle
COPY --from=build /app/scripts/migrate.mjs scripts/migrate.mjs
COPY --from=build /app/package.json .

# Copy node_modules entirely to avoid issues with dependency resolution
COPY --from=build /app/node_modules node_modules

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "node scripts/migrate.mjs && node .output/server/index.mjs"]
