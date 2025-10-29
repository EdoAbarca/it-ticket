# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client without database connection (build-time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npx prisma generate
RUN npm run build

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
