
FROM node:24

WORKDIR /server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 2400

ENV NODE_ENV=production

CMD ["npm", "start"]