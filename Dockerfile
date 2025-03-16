# Multi-architecture Dockerfile for Next.js application
# Supports amd64 and arm64 architectures

# -----------------------------
# Stage 1: Dependencies
# -----------------------------
FROM --platform=$BUILDPLATFORM node:23.10.0-alpine AS deps
WORKDIR /app

# Install dependencies needed for node-gyp on Alpine
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with clean cache
RUN npm ci --omit=dev --ignore-scripts

# -----------------------------
# Stage 2: Builder
# -----------------------------
FROM --platform=$BUILDPLATFORM node:23.10.0-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# -----------------------------
# Stage 3: Runner
# -----------------------------
FROM --platform=$TARGETPLATFORM node:23.10.0-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV HOSTNAME=0.0.0.0

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the necessary files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Clean up npm cache and unnecessary packages
RUN rm -rf /tmp/* && \
    rm -rf /root/.npm && \
    apk del --purge && \
    apk add --no-cache tini

# Switch to non-root user
USER nextjs

# Set the entrypoint to tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Expose the listening port
EXPOSE 3000

# Set the command to run the application with explicit host binding
CMD ["node", "server.js"] 