# syntax=docker/dockerfile:1

FROM node:16

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]
RUN ls -a
RUN npm install
COPY . .
CMD [ "node", "index.js" ]