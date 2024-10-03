FROM node:22

WORKDIR /app/OSS-doorway

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Expose default Probot port
EXPOSE 3000

CMD [ "npm", "run", "start" ]