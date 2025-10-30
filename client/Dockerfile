FROM node:20

ENV NODE_ENV=production

WORKDIR /client

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 2400

CMD ["npm", "run", "dev"]