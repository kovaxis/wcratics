# === Build stage ===
FROM node:current-alpine AS builder
WORKDIR /app-build

# Copy manifests and others to install dependencies
COPY *.json *.js *.ts ./
RUN npm install

# Copy source and build
COPY src ./src
COPY static ./static
RUN npm run build

# === Serve stage ===
FROM node:current-alpine
WORKDIR /app

# Install production dependencies
COPY package.json package-lock.json /app/
RUN npm ci --omit dev

# Copy built project and run
COPY --from=builder /app-build/build /app/build
CMD ["node", "build"]
