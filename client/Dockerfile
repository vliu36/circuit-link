FROM node:20

WORKDIR /client

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 2400

ENV NODE_ENV=production

CMD ["npm", "run", "dev"]