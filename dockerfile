FROM node:22

WORKDIR /app/OSS-doorway

# this will install packages, development will be using bind mounting for better development flow
COPY package*.json ./

RUN npm install

EXPOSE 3000

CMD [ "npm", "run", "start" ]