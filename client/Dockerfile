# Dockerfile for building the web client image
# Divided into two stages for nextjs: build and production

# Build stage
FROM node:20 AS nextBuild

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

# Copies static files from the build to production folder
COPY --from=nextBuild /app/.next ./.next

COPY --from=nextBuild /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]