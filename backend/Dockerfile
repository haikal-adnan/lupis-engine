FROM node:20-slim

# Install dependensi sistem + Wine (wajib untuk electron-builder membuat .exe di Linux)
RUN dpkg --add-architecture i386 && \
    apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    wine \
    wine32 \
    wine64 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install seluruh dependensi (backend & electron toolchain)
COPY package*.json ./
RUN npm install

# Copy seluruh source code
COPY . .

CMD ["node", "server.js"]