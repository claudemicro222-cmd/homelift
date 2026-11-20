FROM node:22-alpine
# Unraid läser ikon och webbadress från de här etiketterna
LABEL org.opencontainers.image.title="HomeLift" \
      org.opencontainers.image.description="Självhostat träningsprogram med Home Assistant-integration" \
      org.opencontainers.image.source="https://github.com/claudemicro222-cmd/homelift" \
      org.opencontainers.image.licenses="MIT" \
      net.unraid.docker.icon="https://raw.githubusercontent.com/claudemicro222-cmd/homelift/main/public/icon-512.png" \
      net.unraid.docker.webui="http://[IP]:[PORT:8080]/"
# python3 behövs för yt-dlp (nedladdning av instruktionsvideor, hämtas vid första användning)
RUN apk add --no-cache python3
WORKDIR /app
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data
COPY package.json ./
COPY src ./src
COPY public ./public
COPY data ./data
COPY custom_components ./custom_components
COPY blueprints ./blueprints
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN mkdir -p /data && chown -R node:node /data
VOLUME ["/data"]
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/api/health || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "--no-warnings", "src/server.js"]
