FROM node:20-slim

# Runtime libraries for msdfgen.linux and secure downloads for electron-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libfreetype6 \
    libpng16-16 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "server.js"]
