FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Reproducible, production-only install (uses package-lock.json)
RUN npm ci --omit=dev

COPY app.js server.js ./

EXPOSE 5000

ENV PORT=5000
ENV APP_ENV=production
ENV LOG_LEVEL=info

USER node

CMD ["node", "server.js"]
