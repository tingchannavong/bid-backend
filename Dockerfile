FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma.config.ts ./
COPY prisma ./prisma

RUN npx prisma generate

COPY . .

FROM node:22-alpine AS production

# Multistage: security best practice to run as nodeuser
RUN addgroup -g 1001 -S nodejs && \ 
    adduser -S nodeuser -u 1001

WORKDIR /app

COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/package*.json ./
COPY --from=builder --chown=nodeuser:nodejs /app/src ./src
COPY --from=builder --chown=nodeuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodeuser:nodejs /app/prisma.config.ts ./

USER noderuser

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

EXPOSE 4000

CMD ["npm", "run", "start"]
