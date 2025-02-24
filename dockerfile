# Use an official Node.js image
FROM node:22

# Set the working directory inside the container
WORKDIR /app/OSS-doorway

# Copy package.json to install dependencies
COPY package.json ./

# Install dependencies
RUN npm install

# Now copy the entire app source code
COPY . .  

# Copy the rest of the application files
COPY . .

# Expose the port if needed
EXPOSE 3000

# Ensure dependencies are installed before starting the application
CMD ["sh", "-c", "npm install && npm run start"]
