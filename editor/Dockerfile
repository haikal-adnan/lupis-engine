FROM node:20-alpine

WORKDIR /app

COPY editor/package*.json ./

RUN npm install

COPY editor/ .

COPY core/ /core/

EXPOSE 37600

CMD ["npm", "run", "dev"]