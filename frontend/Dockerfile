FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

COPY engine/ /engine/

EXPOSE 6500

CMD ["npm", "run", "dev"]