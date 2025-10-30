# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Note: If you encounter network timeouts, check your DNS/proxy settings
RUN npm ci --only=production=false || npm install

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client without database connection (build-time only)
# Dummy DATABASE_URL is used as Prisma requires it even without actual DB connection
# This does NOT affect runtime security as the real DATABASE_URL is provided at runtime via .env
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production || npm install --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["./docker-entrypoint.sh"]
