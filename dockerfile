FROM node:latest

WORKDIR /APP

COPY . . 

EXPOSE 3000 

RUN npm install

CMD ["npm", "start"]