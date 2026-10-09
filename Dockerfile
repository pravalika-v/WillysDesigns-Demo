FROM node:24.19.0-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json server.mjs database.mjs ./
COPY --chown=node:node public ./public
COPY --chown=node:node scripts ./scripts
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV NODE_ENV=production PORT=3000 DB_PATH=/app/data/enquiries.sqlite
EXPOSE 3000
CMD ["node", "server.mjs"]
