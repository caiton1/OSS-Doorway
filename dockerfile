FROM node:22

WORKDIR /app/OSS-doorway

# Copy package.json and package-lock.json first (dependency installation step)
COPY package*.json ./

RUN npm install

# Now copy the entire app source code
COPY . .  

EXPOSE 3000

CMD ["npm", "run", "start"]
