# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# إعداد المستخدمين
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# نسخ الملفات الأساسية
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

# التعامل مع الـ standalone إذا وجد
RUN if [ -d "/app/.next/standalone" ]; then \
      cp -R /app/.next/standalone/* /app/ ; \
    fi

# --- الجزء المعدل لحل مشكلة الـ Permission و Railway Volumes ---
USER root

# إنشاء الفولدر وإعطاء صلاحيات كاملة (777) لتجنب أزمة lost+found
RUN mkdir -p /app/public/media && \
    chown -R nextjs:nodejs /app/public/media && \
    chmod -R 777 /app/public/media

# العودة للمستخدم الآمن
USER nextjs
# -----------------------------------------------------------

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# تشغيل السيرفر
CMD sh -c 'if [ -f /app/server.js ]; then node /app/server.js; else node node_modules/.bin/next start -p ${PORT:-3000} -H 0.0.0.0; fi'