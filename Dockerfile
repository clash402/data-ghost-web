FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build
RUN npm prune --omit=dev
# The runtime process executes Next directly, so npm/npx are not needed in the final image.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node_modules/next/dist/bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
