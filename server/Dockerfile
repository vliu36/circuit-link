
FROM node:24

ENV NODE_ENV=production

WORKDIR /server

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 2400

CMD ["npm", "start"]