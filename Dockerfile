# Stage 1: Build the React app
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Run the Express API and serve the built frontend
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=build /app/dist ./dist
COPY server ./server

EXPOSE 3000

CMD ["node", "server/index.mjs"]
