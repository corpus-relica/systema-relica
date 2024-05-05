FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install -g nodemon

RUN npm install

COPY . .

EXPOSE 3000

CMD ["nodemon", "--watch", ".", "--exec", "npm", "run", "start:dev"]
