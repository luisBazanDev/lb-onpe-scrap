FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY src/ ./src/
COPY public/ ./public/
COPY db.json ./db.json

EXPOSE 3001

CMD ["npm", "start"]
