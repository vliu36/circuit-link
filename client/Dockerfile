FROM node:24

WORKDIR /client

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 2400

CMD ["npm", "run", "dev"]