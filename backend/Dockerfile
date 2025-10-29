# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client without database connection (build-time only)
# Dummy DATABASE_URL is used as Prisma requires it even without actual DB connection
# NODE_TLS_REJECT_UNAUTHORIZED is set only for build to handle corporate proxy/firewall scenarios
# This does NOT affect runtime security as the real DATABASE_URL is provided at runtime via .env
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate
RUN npm run build

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
