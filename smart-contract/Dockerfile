# smart-contract/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Container ini akan terus berjalan, kita akan menggunakannya dengan 'docker compose exec'
# CMD ["tail", "-f", "/dev/null"] membuat container tetap hidup
CMD ["tail", "-f", "/dev/null"]